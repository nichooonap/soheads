// Curated lookup lists for tags. Covers major Sorare competitions.
export const COMPETITIONS = [
  "Premier League",
  "LaLiga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
  "Champions League",
  "Europa League",
  "MLS",
  "Eredivisie",
  "Liga Portugal",
  "Saudi Pro League",
  "K-League",
  "J-League",
  "All Star",
  "Contender",
  "Champion",
  "Under 23",
  "Challenger",
  "International",
  "Other",
] as const;

export const GAMEWEEKS = Array.from({ length: 100 }, (_, i) => `GW${i + 1}`);

// Curated mood / theme tags users can pick from when saving a squad.
export const ADDITIONAL_TAGS = [
  // Vibe
  "Funny",
  "Meme",
  "Goat squad",
  "All-stars",
  "Throwback",
  // Player archetypes
  "Wonderkids",
  "Veterans",
  "Cult heroes",
  "One-club legends",
  "Underdogs",
  // Budget / rarity
  "Budget",
  "Value play",
  "Common army",
  "Full Unique",
  // Tactical / competitive
  "Meta pick",
  "Punt squad",
  // Theme / challenge
  "One nation",
  "Derby day",
  "WC 2026",
  "Golden era",
] as const;

export type Competition = (typeof COMPETITIONS)[number];
export type AdditionalTag = (typeof ADDITIONAL_TAGS)[number];
