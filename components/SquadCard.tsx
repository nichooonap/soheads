"use client";

import Link from "next/link";
import { CaretUp as ChevronUp } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { RARITY_DOT, RARITY_LABEL, normaliseRarity } from "@/lib/rarity";
import { cn } from "@/lib/utils";

type Slot = {
  rarity: string;
  position: string;
};

export type SquadSummary = {
  id: string;
  name: string;
  formation: number;
  competition_tag: string | null;
  gameweek_tag: string | null;
  additional_tags: string[];
  votes_count: number;
  squad_slots: Slot[] | null;
};

export function SquadCard({ squad }: { squad: SquadSummary }) {
  const slots = squad.squad_slots ?? [];
  const counts = slots.reduce<Record<string, number>>((acc, s) => {
    const k = normaliseRarity(s.rarity);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Link
      href={`/squad/${squad.id}`}
      className="group flex flex-col rounded-2xl border border-border/70 bg-card p-5 transition hover:border-primary/40 hover:bg-card/80"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-base font-semibold leading-tight tracking-tight">
          {squad.name}
        </h3>
        <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/60 bg-background/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          <ChevronUp className="h-3.5 w-3.5" />
          {squad.votes_count}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {Object.entries(counts).map(([r, n]) => (
          <span
            key={r}
            className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-0.5 text-[11px] font-medium"
          >
            <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r])} />
            {n} {RARITY_LABEL[r] ?? r}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="outline" className="rounded-full border-border/60 text-[11px] font-normal">
          {squad.formation}-a-side
        </Badge>
        {squad.competition_tag && (
          <Badge variant="outline" className="rounded-full border-border/60 text-[11px] font-normal">
            {squad.competition_tag}
          </Badge>
        )}
        {squad.gameweek_tag && (
          <Badge variant="outline" className="rounded-full border-border/60 text-[11px] font-normal">
            {squad.gameweek_tag}
          </Badge>
        )}
        {squad.additional_tags?.slice(0, 3).map((t) => (
          <Badge
            key={t}
            variant="outline"
            className="rounded-full border-border/60 text-[11px] font-normal"
          >
            #{t}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
