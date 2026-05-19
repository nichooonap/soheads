import { createServerClient } from "@/lib/supabase/server";
const supabaseAdmin = createServerClient();

const SORARE_URL = "https://api.sorare.com/graphql";

const SEARCH_TTL_HOURS = 24;
const PLAYER_TTL_DAYS = 7;

async function sorare<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const res = await fetch(SORARE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "JWT-AUD": "soheads",
      "User-Agent": "soheads/0.1",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sorare API ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: T; errors?: any };
  if (json.errors) {
    throw new Error(`Sorare GraphQL error: ${JSON.stringify(json.errors).slice(0, 300)}`);
  }
  return json.data as T;
}

// Player metadata only — keep complexity low. `anyPositions` is the
// multi-position array; `position` is the canonical primary position.
const PLAYER_META_QUERY = `
  query Player($slug: String!) {
    football {
      player(slug: $slug) {
        slug
        displayName
        position
        anyPositions
        pictureUrl
        activeClub {
          name
          domesticLeague { displayName }
        }
      }
    }
  }
`;

// All rarities in one query using aliased fields with inline enum values.
// Variables don't work for Sorare's Rarity enum — inline values are required.
// first:15 per alias keeps total complexity under Sorare's 500 public limit.
// anyPositions is intentionally omitted — soheads has no slot rules, all cards show.
const PLAYER_CARDS_QUERY = `
  query PlayerCards($slug: String!) {
    football {
      player(slug: $slug) {
        common:     anyCards(first: 15, rarities: [common])     { nodes { rarityTyped pictureUrl inSeasonEligible seasonYear } }
        limited:    anyCards(first: 15, rarities: [limited])    { nodes { rarityTyped pictureUrl inSeasonEligible seasonYear } }
        rare:       anyCards(first: 15, rarities: [rare])       { nodes { rarityTyped pictureUrl inSeasonEligible seasonYear } }
        super_rare: anyCards(first: 15, rarities: [super_rare]) { nodes { rarityTyped pictureUrl inSeasonEligible seasonYear } }
        unique:     anyCards(first: 15, rarities: [unique])     { nodes { rarityTyped pictureUrl inSeasonEligible seasonYear } }
      }
    }
  }
`;

type SoraPlayerNode = {
  slug: string;
  displayName: string;
  position: string | null;
  anyPositions?: string[] | null;
  pictureUrl: string | null;
  activeClub: { name: string | null; domesticLeague: { displayName: string | null } | null } | null;
};

export type PlayerSummary = {
  slug: string;
  displayName: string;
  position: string | null;
  positions: string[] | null;
  pictureUrl: string | null;
  team: string | null;
  league: string | null;
};

export type CardVariant = {
  rarity: string;
  seasonYear: number;
  inSeason: boolean;
  cardImageUrl: string | null;
  position: string | null;
};

function toSummary(p: SoraPlayerNode): PlayerSummary {
  const positions =
    p.anyPositions && p.anyPositions.length
      ? p.anyPositions
      : p.position
        ? [p.position]
        : null;
  return {
    slug: p.slug,
    displayName: p.displayName,
    position: p.position ?? null,
    positions,
    pictureUrl: p.pictureUrl ?? null,
    team: p.activeClub?.name ?? null,
    league: p.activeClub?.domesticLeague?.displayName ?? null,
  };
}

async function upsertPlayers(players: PlayerSummary[]) {
  if (!players.length) return;
  await supabaseAdmin.from("players").upsert(
    players.map((p) => ({
      slug: p.slug,
      display_name: p.displayName,
      team_name: p.team,
      league_name: p.league,
      position: p.position,
      positions: p.positions,
      picture_url: p.pictureUrl,
      last_synced_at: new Date().toISOString(),
    })),
    { onConflict: "slug" },
  );
}

const POSITION_MAP: Record<string, string[]> = {
  GK: ["Goalkeeper"],
  DF: ["Defender"],
  MD: ["Midfielder"],
  FW: ["Forward"],
  EX: ["Defender", "Midfielder", "Forward"],
};

function positionMatches(slot: string | null | undefined, player: PlayerSummary) {
  if (!slot) return true;
  const allowed = POSITION_MAP[slot];
  if (!allowed) return true;
  const candidates = player.positions?.length
    ? player.positions
    : player.position
      ? [player.position]
      : [];
  if (!candidates.length) return true; // unknown — don't hide
  return candidates.some((p) => allowed.includes(p));
}

// Curated popular players per position slot. These are seeded into our DB on
// first request so the search overlay isn't empty.
const POPULAR_BY_SLOT: Record<string, string[]> = {
  GK: ["thibaut-courtois", "alisson-becker", "ederson-santana-de-moraes", "gianluigi-donnarumma", "andre-onana", "marc-andre-ter-stegen"],
  DF: ["virgil-van-dijk", "ruben-dias", "william-saliba", "achraf-hakimi", "trent-alexander-arnold", "antonio-rudiger", "joao-cancelo", "alphonso-davies"],
  MD: ["rodrigo-hernandez-cascante", "jude-bellingham", "kevin-de-bruyne", "federico-valverde", "pedri-gonzalez-lopez", "jamal-musiala", "bruno-fernandes", "martin-odegaard"],
  FW: ["erling-haaland", "kylian-mbappe", "vinicius-jose-paixao-de-oliveira-junior", "harry-kane", "lautaro-martinez", "mohamed-salah", "lionel-messi", "robert-lewandowski"],
  EX: ["jude-bellingham", "kylian-mbappe", "vinicius-jose-paixao-de-oliveira-junior", "lamine-yamal", "rodrigo-hernandez-cascante", "bukayo-saka"],
};

function rowToSummary(r: any): PlayerSummary {
  return {
    slug: r.slug,
    displayName: r.display_name,
    team: r.team_name,
    league: r.league_name,
    position: r.position,
    positions: r.positions ?? null,
    pictureUrl: r.picture_url,
  };
}

export async function getPopularPlayersDb(positionSlot?: string | null): Promise<{ players: PlayerSummary[] }> {
  const pos = positionSlot ?? null;

  // Derive popular players from actual squad picks once enough data exists.
  try {
    let q = supabaseAdmin.from("squad_slots").select("player_slug").limit(500);
    if (pos === "GK") q = q.eq("position", "GK");
    else if (pos === "DF") q = q.eq("position", "DF");
    else if (pos === "MD") q = q.eq("position", "MD");
    else if (pos === "FW") q = q.eq("position", "FW");
    else if (pos === "EX") q = q.neq("position", "GK"); // EX = any outfield

    const { data: slotRows } = await q;

    if (slotRows && slotRows.length >= 20) {
      const counts = new Map<string, number>();
      for (const { player_slug } of slotRows) {
        counts.set(player_slug, (counts.get(player_slug) ?? 0) + 1);
      }
      const topSlugs = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([slug]) => slug);

      const { data: rows } = await supabaseAdmin
        .from("players")
        .select("slug, display_name, team_name, league_name, position, positions, picture_url")
        .in("slug", topSlugs);

      if (rows && rows.length >= 4) {
        const bySlug = new Map(rows.map((r) => [r.slug, r]));
        const players = topSlugs
          .map((s) => bySlug.get(s))
          .filter(Boolean)
          .map((r: any) => rowToSummary(r));
        if (players.length >= 4) return { players };
      }
    }
  } catch (err) {
    console.error("getPopularPlayersDb dynamic fetch failed:", err);
  }

  // Fallback: curated list used until enough squads exist in the DB.
  const slugs = POPULAR_BY_SLOT[pos ?? ""] ?? POPULAR_BY_SLOT.FW;

  const { data: rows } = await supabaseAdmin
    .from("players")
    .select("slug, display_name, team_name, league_name, position, positions, picture_url")
    .in("slug", slugs);

  const bySlug = new Map(rows?.map((r) => [r.slug, r]) ?? []);
  const cached = slugs
    .map((s) => bySlug.get(s))
    .filter(Boolean)
    .map((r: any) => rowToSummary(r));

  if (cached.length >= Math.min(6, slugs.length)) return { players: cached };

  const missing = slugs.filter((s) => !bySlug.has(s));
  const fetched: PlayerSummary[] = [];
  await Promise.all(
    missing.map(async (slug) => {
      try {
        const name = slug.replace(/-/g, " ");
        const hits = await algoliaFootballSearch(name);
        const exact = hits.find((h) => h.slug === slug) ?? hits[0];
        if (exact) fetched.push(exact);
      } catch (e) {
        console.error("popular hydrate failed for", slug, e);
      }
    }),
  );
  await upsertPlayers(fetched);
  const merged = [...cached, ...fetched.filter((p) => !bySlug.has(p.slug))];
  return { players: merged };
}

export async function searchPlayersDb(
  query: string,
  positionSlot?: string | null,
): Promise<{ players: PlayerSummary[] }> {
  const key = `${positionSlot ?? "any"}::${query.toLowerCase()}`;

  const { data: cached } = await supabaseAdmin
    .from("player_search_cache")
    .select("result_slugs, cached_at")
    .eq("query", key)
    .maybeSingle();

  if (cached) {
    const ageH = (Date.now() - new Date(cached.cached_at).getTime()) / 36e5;
    if (ageH < SEARCH_TTL_HOURS && cached.result_slugs.length) {
      const { data: rows } = await supabaseAdmin
        .from("players")
        .select("slug, display_name, team_name, league_name, position, positions, picture_url")
        .in("slug", cached.result_slugs);
      const bySlug = new Map(rows?.map((r) => [r.slug, r]) ?? []);
      const players = cached.result_slugs
        .map((s) => bySlug.get(s))
        .filter(Boolean)
        .map((r: any) => rowToSummary(r));
      if (players.length) return { players };
    }
  }

  try {
    const summaries = await algoliaFootballSearch(query);
    await upsertPlayers(summaries);
    // Don't filter by slot position here: Algolia only returns a single
    // primary position per player, but Sorare cards can be issued for
    // multiple positions. The CardPicker filters cards by slot, so let users
    // see every name match and discover multi-position eligibility.
    await supabaseAdmin.from("player_search_cache").upsert({
      query: key,
      result_slugs: summaries.map((s) => s.slug),
      cached_at: new Date().toISOString(),
    });
    return { players: summaries };
  } catch (err) {
    console.error("searchPlayers failed:", err);
    return { players: [] };
  }
}

// ---- Algolia search (football only) ----

const ALGOLIA_APP_ID = "7Z0Z8PASDY";
const ALGOLIA_API_KEY = "30fdac6793afa5b820c36e7202e4b872";
const ALGOLIA_INDEX = "Player";

async function algoliaFootballSearch(query: string): Promise<PlayerSummary[]> {
  const res = await fetch(
    `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX}/query`,
    {
      method: "POST",
      headers: {
        "x-algolia-application-id": ALGOLIA_APP_ID,
        "x-algolia-api-key": ALGOLIA_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        params: new URLSearchParams({
          query,
          hitsPerPage: "12",
          filters: "sport:football",
          attributesToRetrieve:
            "objectID,display_name,position,positions,active_club,active_league,avatar_url,squared_picture_url,sport",
        }).toString(),
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Algolia ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { hits: any[] };
  return (json.hits ?? [])
    .filter((h) => h.sport === "football" && h.objectID)
    .map((h) => {
      const positions: string[] | null =
        Array.isArray(h.positions) && h.positions.length
          ? h.positions
          : h.position
            ? [h.position]
            : null;
      return {
        slug: h.objectID,
        displayName: h.display_name ?? h.objectID,
        position: h.position ?? null,
        positions,
        pictureUrl: h.avatar_url ?? h.squared_picture_url ?? null,
        team: h.active_club?.name ?? null,
        league: h.active_league?.name ?? null,
      };
    });
}

export async function getPlayerCardsDb(
  slug: string,
): Promise<{ player: PlayerSummary | null; cards: CardVariant[] }> {
  const { data: pRow } = await supabaseAdmin
    .from("players")
    .select("slug, display_name, team_name, league_name, position, positions, picture_url, last_synced_at")
    .eq("slug", slug)
    .maybeSingle();

  const fresh =
    pRow && (Date.now() - new Date(pRow.last_synced_at).getTime()) / 86400000 < PLAYER_TTL_DAYS;

  if (fresh) {
    const { data: cardRows } = await supabaseAdmin
      .from("player_cards")
      .select("rarity, season_year, in_season, card_image_url, position")
      .eq("player_slug", slug);
    if (cardRows && cardRows.length) {
      return {
        player: rowToSummary(pRow!),
        cards: cardRows.map((c) => ({
          rarity: c.rarity,
          seasonYear: c.season_year,
          inSeason: c.in_season,
          cardImageUrl: c.card_image_url,
          position: c.position ?? null,
        })),
      };
    }
  }

  try {
    type CardNode = {
      rarityTyped: string;
      pictureUrl: string | null;
      inSeasonEligible: boolean | null;
      seasonYear: number | null;
    };
    const meta = await sorare<{ football: { player: SoraPlayerNode | null } }>(
      PLAYER_META_QUERY,
      { slug },
    );
    const p = meta.football.player;
    if (!p) return { player: null, cards: [] };
    const summary = toSummary(p);
    await upsertPlayers([summary]);

    type CardConn = { nodes: CardNode[] };
    type CardsByRarity = {
      common: CardConn; limited: CardConn; rare: CardConn;
      super_rare: CardConn; unique: CardConn;
    };
    const cardResult = await sorare<{ football: { player: (SoraPlayerNode & CardsByRarity) | null } }>(
      PLAYER_CARDS_QUERY,
      { slug },
    ).catch((err) => {
      console.error("cards fetch failed:", err);
      return { football: { player: null } };
    });
    const cp = cardResult.football.player;
    const allNodes: CardNode[] = [
      ...(cp?.common?.nodes ?? []),
      ...(cp?.limited?.nodes ?? []),
      ...(cp?.rare?.nodes ?? []),
      ...(cp?.super_rare?.nodes ?? []),
      ...(cp?.unique?.nodes ?? []),
    ];

    // Group by rarity+year, keeping best card image found.
    const map = new Map<string, CardVariant>();
    for (const c of allNodes) {
      const yr = c.seasonYear;
      if (!yr || !c.rarityTyped) continue;
      const k = `${c.rarityTyped}|${yr}`;
      const existing = map.get(k);
      if (!existing) {
        map.set(k, {
          rarity: c.rarityTyped,
          seasonYear: yr,
          inSeason: !!c.inSeasonEligible,
          cardImageUrl: c.pictureUrl,
          position: null,
        });
      } else if (!existing.cardImageUrl && c.pictureUrl) {
        existing.cardImageUrl = c.pictureUrl;
      }
    }
    const variants = [...map.values()].sort(
      (a, b) => b.seasonYear - a.seasonYear || a.rarity.localeCompare(b.rarity),
    );

    if (variants.length) {
      await supabaseAdmin.from("player_cards").upsert(
        variants.map((v) => ({
          player_slug: summary.slug,
          rarity: v.rarity,
          season_year: v.seasonYear,
          in_season: v.inSeason,
          card_image_url: v.cardImageUrl,
          position: v.position,
        })),
        { onConflict: "player_slug,rarity,season_year" },
      );
    }
    return { player: summary, cards: variants };
  } catch (err) {
    console.error("getPlayerCards failed:", err);
    return {
      player: pRow ? rowToSummary(pRow) : null,
      cards: [],
    };
  }
}
