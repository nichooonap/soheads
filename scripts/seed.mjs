/**
 * Seed script — inserts curated squads with real Sorare player data.
 * Run: node --env-file=.env scripts/seed.mjs
 *
 * Requires in .env:
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   ← get from Supabase Dashboard → Settings → API
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
const ALGOLIA_APP_ID = "7Z0Z8PASDY";
const ALGOLIA_API_KEY = "30fdac6793afa5b820c36e7202e4b872";
const SORARE_URL = "https://api.sorare.com/graphql";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── Curated squads ────────────────────────────────────────────────────────────
// formation 5 slots: GK(0), DF(1), MD(2), FW(3), EX(4)
// formation 7 slots: GK(0), DF(1), DF(2), MD(3), FW(4), EX(5), MD(6)

const SQUADS = [
  {
    name: "Real Madrid Dream XI",
    formation: 5,
    competition_tag: "UEFA Champions League",
    votes_count: 47,
    slots: [
      { index: 0, position: "GK", slug: "thibaut-courtois",                             rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "antonio-rudiger",                               rarity: "rare",       season: 2024 },
      { index: 2, position: "MD", slug: "federico-valverde",                             rarity: "rare",       season: 2024 },
      { index: 3, position: "FW", slug: "vinicius-jose-paixao-de-oliveira-junior",       rarity: "super_rare", season: 2024 },
      { index: 4, position: "EX", slug: "jude-bellingham",                               rarity: "super_rare", season: 2024 },
    ],
  },
  {
    name: "Premier League Fire",
    formation: 5,
    competition_tag: "Premier League",
    votes_count: 39,
    slots: [
      { index: 0, position: "GK", slug: "alisson-becker",         rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "virgil-van-dijk",         rarity: "rare",       season: 2024 },
      { index: 2, position: "MD", slug: "kevin-de-bruyne",         rarity: "super_rare", season: 2024 },
      { index: 3, position: "FW", slug: "mohamed-salah",           rarity: "rare",       season: 2024 },
      { index: 4, position: "EX", slug: "erling-haaland",          rarity: "super_rare", season: 2024 },
    ],
  },
  {
    name: "La Liga Masterclass",
    formation: 5,
    competition_tag: "La Liga",
    votes_count: 31,
    slots: [
      { index: 0, position: "GK", slug: "marc-andre-ter-stegen",         rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "achraf-hakimi",                  rarity: "rare",       season: 2024 },
      { index: 2, position: "MD", slug: "pedri-gonzalez-lopez",           rarity: "rare",       season: 2024 },
      { index: 3, position: "FW", slug: "robert-lewandowski",             rarity: "rare",       season: 2024 },
      { index: 4, position: "EX", slug: "lamine-yamal",                   rarity: "super_rare", season: 2024 },
    ],
  },
  {
    name: "Attack Mode — No Limits",
    formation: 5,
    votes_count: 28,
    slots: [
      { index: 0, position: "GK", slug: "gianluigi-donnarumma",                         rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "trent-alexander-arnold",                       rarity: "rare",       season: 2024 },
      { index: 2, position: "MD", slug: "martin-odegaard",                              rarity: "rare",       season: 2024 },
      { index: 3, position: "FW", slug: "kylian-mbappe",                                rarity: "super_rare", season: 2024 },
      { index: 4, position: "EX", slug: "bukayo-saka",                                  rarity: "rare",       season: 2024 },
    ],
  },
  {
    name: "World Class 7s",
    formation: 7,
    competition_tag: "UEFA Champions League",
    votes_count: 54,
    slots: [
      { index: 0, position: "GK", slug: "thibaut-courtois",                             rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "virgil-van-dijk",                               rarity: "rare",       season: 2024 },
      { index: 2, position: "DF", slug: "antonio-rudiger",                               rarity: "rare",       season: 2024 },
      { index: 3, position: "MD", slug: "rodrigo-hernandez-cascante",                   rarity: "super_rare", season: 2024 },
      { index: 4, position: "FW", slug: "erling-haaland",                               rarity: "super_rare", season: 2024 },
      { index: 5, position: "EX", slug: "vinicius-jose-paixao-de-oliveira-junior",       rarity: "super_rare", season: 2024 },
      { index: 6, position: "MD", slug: "jude-bellingham",                               rarity: "super_rare", season: 2024 },
    ],
  },
  {
    name: "Midfield Maestros",
    formation: 7,
    votes_count: 22,
    slots: [
      { index: 0, position: "GK", slug: "ederson-santana-de-moraes",   rarity: "rare",       season: 2024 },
      { index: 1, position: "DF", slug: "ruben-dias",                   rarity: "rare",       season: 2024 },
      { index: 2, position: "DF", slug: "alphonso-davies",              rarity: "rare",       season: 2024 },
      { index: 3, position: "MD", slug: "kevin-de-bruyne",              rarity: "super_rare", season: 2024 },
      { index: 4, position: "FW", slug: "lautaro-martinez",             rarity: "rare",       season: 2024 },
      { index: 5, position: "EX", slug: "jamal-musiala",                rarity: "rare",       season: 2024 },
      { index: 6, position: "MD", slug: "bruno-fernandes",              rarity: "rare",       season: 2024 },
    ],
  },
  {
    name: "Messi's Last Dance",
    formation: 5,
    votes_count: 61,
    slots: [
      { index: 0, position: "GK", slug: "gianluigi-donnarumma",        rarity: "limited",    season: 2024 },
      { index: 1, position: "DF", slug: "joao-cancelo",                rarity: "rare",       season: 2024 },
      { index: 2, position: "MD", slug: "pedri-gonzalez-lopez",        rarity: "rare",       season: 2024 },
      { index: 3, position: "FW", slug: "lionel-messi",                rarity: "super_rare", season: 2024 },
      { index: 4, position: "EX", slug: "lamine-yamal",                rarity: "rare",       season: 2024 },
    ],
  },
];

// ── API helpers ───────────────────────────────────────────────────────────────

async function algoliaSearch(slug) {
  const query = slug.replace(/-/g, " ");
  const res = await fetch(
    `https://${ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/Player/query`,
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
          hitsPerPage: "5",
          filters: "sport:football",
          attributesToRetrieve:
            "objectID,display_name,position,positions,active_club,active_league,avatar_url,squared_picture_url",
        }).toString(),
      }),
    },
  );
  if (!res.ok) throw new Error(`Algolia ${res.status}`);
  const json = await res.json();
  return (json.hits ?? []).find((h) => h.objectID === slug) ?? json.hits?.[0] ?? null;
}

async function sorareCards(slug) {
  const query = `
    query PlayerCards($slug: String!, $rarities: [Rarity!]) {
      football {
        player(slug: $slug) {
          anyCards(first: 10, rarities: $rarities) {
            nodes { rarityTyped pictureUrl inSeasonEligible seasonYear anyPositions }
          }
        }
      }
    }
  `;
  const rarities = ["common", "limited", "rare", "super_rare"];
  const res = await fetch(SORARE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "JWT-AUD": "soheads", "User-Agent": "soheads/0.1" },
    body: JSON.stringify({ query, variables: { slug, rarities } }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.football?.player?.anyCards?.nodes ?? [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  // Collect all unique player slugs
  const allSlugs = [...new Set(SQUADS.flatMap((s) => s.slots.map((sl) => sl.slug)))];
  console.log(`Fetching data for ${allSlugs.length} players…`);

  const playerRows = [];
  const cardRows = [];

  for (const slug of allSlugs) {
    process.stdout.write(`  ${slug}…`);
    try {
      const hit = await algoliaSearch(slug);
      if (!hit) { console.log(" not found"); continue; }

      playerRows.push({
        slug,
        display_name: hit.display_name ?? slug,
        position: hit.position ?? null,
        positions: hit.positions ?? null,
        picture_url: hit.avatar_url ?? hit.squared_picture_url ?? null,
        team_name: hit.active_club?.name ?? null,
        league_name: hit.active_league?.name ?? null,
        last_synced_at: new Date().toISOString(),
      });

      const cards = await sorareCards(slug);
      for (const c of cards) {
        if (!c.rarityTyped || !c.seasonYear) continue;
        const positions = c.anyPositions?.length ? c.anyPositions : [""];
        for (const pos of positions) {
          cardRows.push({
            player_slug: slug,
            rarity: c.rarityTyped,
            season_year: c.seasonYear,
            in_season: !!c.inSeasonEligible,
            card_image_url: c.pictureUrl ?? null,
            position: pos || null,
          });
        }
      }
      console.log(` ✓ (${cards.length} cards)`);
    } catch (e) {
      console.log(` error: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 300)); // rate limit
  }

  // Insert players
  console.log("\nUpserting players…");
  const { error: pErr } = await supabase.from("players").upsert(playerRows, { onConflict: "slug" });
  if (pErr) console.error("Players error:", pErr.message);
  else console.log(`  ✓ ${playerRows.length} players`);

  // Insert cards (deduplicate by player_slug+rarity+season_year)
  const seenCards = new Set();
  const uniqueCards = cardRows.filter((c) => {
    const k = `${c.player_slug}|${c.rarity}|${c.season_year}`;
    if (seenCards.has(k)) return false;
    seenCards.add(k);
    return true;
  });
  console.log("Upserting player cards…");
  const { error: cErr } = await supabase
    .from("player_cards")
    .upsert(uniqueCards, { onConflict: "player_slug,rarity,season_year" });
  if (cErr) console.error("Cards error:", cErr.message);
  else console.log(`  ✓ ${uniqueCards.length} cards`);

  // Insert squads + slots
  console.log("Inserting squads…");
  for (const squad of SQUADS) {
    const { data: sq, error: sqErr } = await supabase
      .from("squads")
      .insert({
        name: squad.name,
        formation: squad.formation,
        competition_tag: squad.competition_tag ?? null,
        gameweek_tag: squad.gameweek_tag ?? null,
        additional_tags: [],
        votes_count: squad.votes_count ?? 0,
      })
      .select("id")
      .single();

    if (sqErr || !sq) { console.error(`  Squad "${squad.name}" error:`, sqErr?.message); continue; }

    const slotRows = squad.slots.map((sl) => ({
      squad_id: sq.id,
      slot_index: sl.index,
      position: sl.position,
      player_slug: sl.slug,
      rarity: sl.rarity,
      season_year: sl.season,
      in_season: true,
    }));

    const { error: slErr } = await supabase.from("squad_slots").insert(slotRows);
    if (slErr) console.error(`  Slots error for "${squad.name}":`, slErr.message);
    else console.log(`  ✓ "${squad.name}"`);
  }

  console.log("\nDone.");
}

run().catch(console.error);
