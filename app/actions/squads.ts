"use server";

import {
  createSquadDb,
  listSquadsDb,
  getSquadDb,
  upvoteSquadDb,
  getHotPlayersDb,
  type CreateSquadInput,
  type ListSquadsInput,
} from "@/lib/server/squads";

export async function createSquad(data: CreateSquadInput) {
  return createSquadDb(data);
}

export async function listSquads(data: ListSquadsInput) {
  return listSquadsDb(data);
}

export async function getSquad(id: string) {
  return getSquadDb(id);
}

export async function upvoteSquad(id: string, device_id: string) {
  return upvoteSquadDb(id, device_id);
}

export async function getHotPlayers() {
  return getHotPlayersDb();
}
