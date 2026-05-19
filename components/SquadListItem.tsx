"use client";

import Link from "next/link";
import { CaretUp as ChevronUp, CaretDown as ChevronDown } from "@phosphor-icons/react";
import { RARITY_DOT, RARITY_LABEL, normaliseRarity } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import type { SquadSummary } from "@/components/SquadCard";

export type SquadListSummary = SquadSummary & { thumbnail_url?: string | null };

const COLS =
  "grid-cols-[44px_minmax(0,1fr)_auto] sm:grid-cols-[56px_minmax(0,2fr)_minmax(0,1fr)_140px_72px]";

export function SquadList({
  squads,
  votesDir = "desc",
  onToggleVotes,
}: {
  squads: SquadListSummary[];
  votesDir?: "asc" | "desc";
  onToggleVotes?: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60">
      <div
        className={cn(
          "hidden items-center gap-4 border-b border-border/60 bg-muted/30 px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:grid",
          COLS,
        )}
      >
        <span></span>
        <span>Squad</span>
        <span>Competition</span>
        <span>Rarities</span>
        <button
          type="button"
          onClick={onToggleVotes}
          className="flex items-center justify-end gap-1 text-right uppercase tracking-wider transition hover:text-foreground"
        >
          Votes
          {votesDir === "desc" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
        </button>
      </div>

      <ul className="divide-y divide-border/60">
        {squads.map((s) => (
          <SquadRow key={s.id} squad={s} />
        ))}
      </ul>
    </div>
  );
}

function SquadRow({ squad }: { squad: SquadListSummary }) {
  const slots = squad.squad_slots ?? [];
  const counts = slots.reduce<Record<string, number>>((acc, sl) => {
    const k = normaliseRarity(sl.rarity);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <li>
      <Link
        href={`/squad/${squad.id}`}
        className={cn(
          "grid items-center gap-3 px-3 py-2.5 transition hover:bg-accent/40 sm:gap-4 sm:px-4 sm:py-3",
          COLS,
        )}
      >
        <div className="grid h-14 w-10 grid-cols-2 gap-[1px] overflow-hidden rounded-sm bg-border/40 sm:h-16 sm:w-12">
          {(squad.squad_slots ?? []).map((sl, i) => (
            <div key={i} className="overflow-hidden bg-muted">
              {sl.picture_url && (
                <img
                  src={sl.picture_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover object-top"
                />
              )}
            </div>
          ))}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold tracking-tight">{squad.name}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              {squad.formation}-a-side
            </span>
            {squad.additional_tags?.slice(0, 4).map((t) => (
              <span
                key={t}
                className="rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                #{t}
              </span>
            ))}
          </div>
          {/* Mobile-only: competition + rarities */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted-foreground sm:hidden">
            {squad.competition_tag && <span>{squad.competition_tag}</span>}
            {squad.gameweek_tag && <span>· {squad.gameweek_tag}</span>}
            {Object.entries(counts).map(([r, n]) => (
              <span key={r} className="inline-flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", RARITY_DOT[r])} />
                {n}
              </span>
            ))}
          </div>
        </div>

        <div className="hidden min-w-0 flex-col text-xs sm:flex">
          {squad.competition_tag ? (
            <span className="truncate font-medium text-foreground">{squad.competition_tag}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
          {squad.gameweek_tag && (
            <span className="truncate text-[11px] text-muted-foreground">
              {squad.gameweek_tag}
            </span>
          )}
        </div>

        <div className="hidden flex-wrap items-center gap-1.5 sm:flex">
          {Object.entries(counts).map(([r, n]) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
              title={RARITY_LABEL[r] ?? r}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", RARITY_DOT[r])} />
              {n}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1 text-xs font-medium text-muted-foreground">
          <ChevronUp className="h-3.5 w-3.5" />
          {squad.votes_count}
        </div>
      </Link>
    </li>
  );
}
