import { createServerClient } from "@/lib/supabase/server";
const supabaseAdmin = createServerClient();

export type CreateSquadInput = {
  name: string;
  formation: 5 | 7;
  competition_tag?: string | null;
  gameweek_tag?: string | null;
  additional_tags: string[];
  device_id: string;
  slots: Array<{
    slot_index: number;
    position: string;
    player_slug: string;
    rarity: string;
    season_year: number;
    in_season: boolean;
  }>;
};

export async function createSquadDb(data: CreateSquadInput): Promise<{ id: string }> {
  if (data.slots.length !== data.formation) {
    throw new Error(`Formation ${data.formation} requires exactly ${data.formation} players`);
  }
  const { data: squad, error } = await supabaseAdmin
    .from("squads")
    .insert({
      name: data.name,
      formation: data.formation,
      competition_tag: data.competition_tag ?? null,
      gameweek_tag: data.gameweek_tag ?? null,
      additional_tags: data.additional_tags,
      creator_device_id: data.device_id,
    })
    .select("id")
    .single();
  if (error || !squad) throw new Error(error?.message ?? "Failed to create squad");

  const { error: slotsErr } = await supabaseAdmin.from("squad_slots").insert(
    data.slots.map((s) => ({
      squad_id: squad.id,
      slot_index: s.slot_index,
      position: s.position,
      player_slug: s.player_slug,
      rarity: s.rarity,
      season_year: s.season_year,
      in_season: s.in_season,
    })),
  );
  if (slotsErr) {
    await supabaseAdmin.from("squads").delete().eq("id", squad.id);
    throw new Error(slotsErr.message);
  }
  return { id: squad.id };
}

export type ListSquadsInput = {
  sort: "top_all" | "top_week" | "top_month" | "new";
  competition?: string | null;
  gameweek?: string | null;
  rarity?: string | null;
  formation?: 5 | 7 | null;
  additional_tags?: string[] | null;
  player_slugs?: string[] | null;
  limit: number;
};

export async function listSquadsDb(data: ListSquadsInput) {
  let q = supabaseAdmin
    .from("squads")
    .select(
      "id, name, formation, competition_tag, gameweek_tag, additional_tags, votes_count, created_at, squad_slots (slot_index, position, player_slug, rarity, season_year, in_season)",
    )
    .limit(data.limit);

  if (data.competition) q = q.eq("competition_tag", data.competition);
  if (data.gameweek) q = q.eq("gameweek_tag", data.gameweek);
  if (data.formation) q = q.eq("formation", data.formation);
  if (data.additional_tags && data.additional_tags.length) {
    // Squad must contain ALL selected tags.
    q = q.contains("additional_tags", data.additional_tags);
  }

  const now = new Date();
  if (data.sort === "top_week") {
    const since = new Date(now.getTime() - 7 * 86400000).toISOString();
    q = q.gte("created_at", since).order("votes_count", { ascending: false });
  } else if (data.sort === "top_month") {
    const since = new Date(now.getTime() - 30 * 86400000).toISOString();
    q = q.gte("created_at", since).order("votes_count", { ascending: false });
  } else if (data.sort === "top_all") {
    q = q.order("votes_count", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }

  const { data: squads, error } = await q;
  if (error) throw new Error(error.message);

  let filtered = squads ?? [];
  if (data.rarity === "mixed") {
    filtered = filtered.filter((s: any) => {
      const rarities = new Set(
        (s.squad_slots ?? []).map((sl: any) => sl.rarity).filter(Boolean),
      );
      return rarities.size > 1;
    });
  } else if (data.rarity) {
    filtered = filtered.filter((s: any) =>
      (s.squad_slots ?? []).some((sl: any) => sl.rarity === data.rarity),
    );
  }
  if (data.player_slugs && data.player_slugs.length) {
    const required = data.player_slugs;
    filtered = filtered.filter((s: any) => {
      const slugs = new Set((s.squad_slots ?? []).map((sl: any) => sl.player_slug));
      return required.every((slug) => slugs.has(slug));
    });
  }

  // Attach a thumbnail card image (from the first slot's player+rarity+year).
  const allSlugs = Array.from(
    new Set(
      filtered.flatMap((s: any) =>
        (s.squad_slots ?? []).map((sl: any) => sl.player_slug).filter(Boolean),
      ),
    ),
  );
  let cardMap = new Map<string, string>();
  let pictureMap = new Map<string, string>();
  if (allSlugs.length) {
    const [{ data: cards }, { data: playerRows }] = await Promise.all([
      supabaseAdmin
        .from("player_cards")
        .select("player_slug, rarity, season_year, card_image_url")
        .in("player_slug", allSlugs),
      supabaseAdmin
        .from("players")
        .select("slug, picture_url")
        .in("slug", allSlugs),
    ]);
    for (const c of cards ?? []) {
      if (!c.card_image_url) continue;
      const key = `${c.player_slug}|${c.rarity}|${c.season_year}`;
      if (!cardMap.has(key)) cardMap.set(key, c.card_image_url);
      const looseKey = `${c.player_slug}|${c.rarity}`;
      if (!cardMap.has(looseKey)) cardMap.set(looseKey, c.card_image_url);
      const slugKey = `${c.player_slug}`;
      if (!cardMap.has(slugKey)) cardMap.set(slugKey, c.card_image_url);
    }
    for (const p of playerRows ?? []) {
      if (p.picture_url) pictureMap.set(p.slug, p.picture_url);
    }
  }

  const withThumb = filtered.map((s: any) => {
    const slots = [...(s.squad_slots ?? [])].sort(
      (a: any, b: any) => (a.slot_index ?? 0) - (b.slot_index ?? 0),
    );
    let thumb: string | null = null;
    for (const sl of slots) {
      const k1 = `${sl.player_slug}|${sl.rarity}|${sl.season_year}`;
      const k2 = `${sl.player_slug}|${sl.rarity}`;
      const k3 = `${sl.player_slug}`;
      thumb = cardMap.get(k1) ?? cardMap.get(k2) ?? cardMap.get(k3) ?? null;
      if (thumb) break;
    }
    const slotsWithCards = slots.map((sl: any) => ({
      ...sl,
      card_image_url:
        cardMap.get(`${sl.player_slug}|${sl.rarity}|${sl.season_year}`) ??
        cardMap.get(`${sl.player_slug}|${sl.rarity}`) ??
        cardMap.get(sl.player_slug) ??
        null,
    }));
    return { ...s, squad_slots: slotsWithCards, thumbnail_url: thumb };
  });

  return { squads: withThumb };
}

export async function getSquadDb(id: string) {
  const { data: squad, error } = await supabaseAdmin
    .from("squads")
    .select(
      "id, name, formation, competition_tag, gameweek_tag, additional_tags, votes_count, created_at, squad_slots (slot_index, position, player_slug, rarity, season_year, in_season)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!squad) return { squad: null, players: [], cards: [] };

  const slugs = (squad.squad_slots ?? []).map((s: any) => s.player_slug);
  const { data: players } = await supabaseAdmin
    .from("players")
    .select("slug, display_name, team_name, league_name, position, picture_url")
    .in("slug", slugs);
  const { data: cards } = await supabaseAdmin
    .from("player_cards")
    .select("player_slug, rarity, season_year, card_image_url")
    .in("player_slug", slugs);

  return { squad, players: players ?? [], cards: cards ?? [] };
}

export async function upvoteSquadDb(id: string, device_id: string) {
  const { error } = await supabaseAdmin
    .from("squad_votes")
    .insert({ squad_id: id, voter_device_id: device_id });
  // 23505 = unique_violation (duplicate vote) — expected, not an error
  if (error && (error as any).code !== "23505") {
    throw new Error(error.message);
  }
  const { data: row } = await supabaseAdmin
    .from("squads")
    .select("votes_count")
    .eq("id", id)
    .maybeSingle();
  return { votes: row?.votes_count ?? 0, alreadyVoted: !!error };
}

export async function getHotPlayersDb(limit = 24) {
  // Pull recent slot usage and aggregate by player_slug.
  const { data: slots, error } = await supabaseAdmin
    .from("squad_slots")
    .select("player_slug, rarity, season_year")
    .limit(2000);
  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  const bestRarity = new Map<string, { rarity: string; year: number }>();
  const RARITY_RANK: Record<string, number> = {
    unique: 5,
    super_rare: 4,
    rare: 3,
    limited: 2,
    common: 1,
  };
  for (const s of slots ?? []) {
    if (!s.player_slug) continue;
    counts.set(s.player_slug, (counts.get(s.player_slug) ?? 0) + 1);
    const cur = bestRarity.get(s.player_slug);
    const curRank = cur ? RARITY_RANK[cur.rarity] ?? 0 : -1;
    const nextRank = RARITY_RANK[s.rarity] ?? 0;
    if (nextRank > curRank) {
      bestRarity.set(s.player_slug, { rarity: s.rarity, year: s.season_year });
    }
  }

  const topSlugs = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([slug]) => slug);
  if (!topSlugs.length) return { players: [] };

  const [{ data: players }, { data: cards }] = await Promise.all([
    supabaseAdmin
      .from("players")
      .select("slug, display_name, position, team_name, picture_url")
      .in("slug", topSlugs),
    supabaseAdmin
      .from("player_cards")
      .select("player_slug, rarity, season_year, card_image_url")
      .in("player_slug", topSlugs),
  ]);

  const playerMap = new Map((players ?? []).map((p: any) => [p.slug, p]));
  const cardKey = (slug: string, rarity: string, year: number) =>
    `${slug}|${rarity}|${year}`;
  const cardMap = new Map<string, string>();
  for (const c of cards ?? []) {
    if (!c.card_image_url) continue;
    const k = cardKey(c.player_slug, c.rarity, c.season_year);
    if (!cardMap.has(k)) cardMap.set(k, c.card_image_url);
    const k2 = `${c.player_slug}|${c.rarity}`;
    if (!cardMap.has(k2)) cardMap.set(k2, c.card_image_url);
    const k3 = `${c.player_slug}`;
    if (!cardMap.has(k3)) cardMap.set(k3, c.card_image_url);
  }

  const result = topSlugs.map((slug) => {
    const p = playerMap.get(slug) as any;
    const br = bestRarity.get(slug);
    const card =
      (br && cardMap.get(cardKey(slug, br.rarity, br.year))) ??
      (br && cardMap.get(`${slug}|${br.rarity}`)) ??
      cardMap.get(slug) ??
      null;
    return {
      slug,
      display_name: p?.display_name ?? slug,
      position: p?.position ?? null,
      team_name: p?.team_name ?? null,
      picture_url: p?.picture_url ?? null,
      card_image_url: card,
      uses: counts.get(slug) ?? 0,
    };
  });
  return { players: result };
}
