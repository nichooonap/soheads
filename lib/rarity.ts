export const RARITY_ORDER = ["limited", "rare", "super_rare", "unique"] as const;
export type Rarity = (typeof RARITY_ORDER)[number];

export const RARITY_LABEL: Record<string, string> = {
  common: "Common",
  limited: "Limited",
  rare: "Rare",
  super_rare: "Super Rare",
  unique: "Unique",
};

export const RARITY_DOT: Record<string, string> = {
  common: "bg-rarity-common",
  limited: "bg-rarity-limited",
  rare: "bg-rarity-rare",
  super_rare: "bg-rarity-super-rare",
  unique: "bg-rarity-unique",
};

export const RARITY_RING: Record<string, string> = {
  common: "ring-rarity-common",
  limited: "ring-rarity-limited",
  rare: "ring-rarity-rare",
  super_rare: "ring-rarity-super-rare",
  unique: "ring-rarity-unique",
};

export function normaliseRarity(r: string): string {
  return r.toLowerCase().replace(/-/g, "_");
}
