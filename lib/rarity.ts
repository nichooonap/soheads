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
  common: "bg-slate-400",
  limited: "bg-amber-400",
  rare: "bg-red-500",
  super_rare: "bg-blue-500",
  unique: "bg-violet-500",
};

export const RARITY_RING: Record<string, string> = {
  common: "ring-slate-400",
  limited: "ring-amber-400",
  rare: "ring-red-500",
  super_rare: "ring-blue-500",
  unique: "ring-violet-500",
};

export function normaliseRarity(r: string): string {
  return r.toLowerCase().replace(/-/g, "_");
}
