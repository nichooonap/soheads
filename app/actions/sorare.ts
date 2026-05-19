"use server";

import { searchPlayersDb, getPopularPlayersDb, getPlayerCardsDb } from "@/lib/server/sorare";
export type { CardVariant, PlayerSummary } from "@/lib/server/sorare";

export async function searchPlayers(query: string, position?: string | null) {
  return searchPlayersDb(query, position);
}

export async function getPopularPlayers(position?: string | null) {
  return getPopularPlayersDb(position);
}

export async function getPlayerCards(slug: string) {
  return getPlayerCardsDb(slug);
}
