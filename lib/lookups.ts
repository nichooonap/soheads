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
  "Funny",
  "Meme",
  "Underdogs",
  "Goat squad",
  "Wonderkids",
  "Veterans",
  "All-stars",
  "Budget",
  "Cult heroes",
  "One-club legends",
  "Derby day",
  "Throwback",
] as const;

export type Competition = (typeof COMPETITIONS)[number];
export type AdditionalTag = (typeof ADDITIONAL_TAGS)[number];
