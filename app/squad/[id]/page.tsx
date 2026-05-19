"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CaretUp as ChevronUp, CopySimple as Duplicate, Export as Share2 } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Pitch, type PitchSlotData } from "@/components/Pitch";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getSquad, upvoteSquad } from "@/app/actions/squads";
import { RARITY_DOT, RARITY_LABEL, normaliseRarity } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import { getDeviceId } from "@/lib/device-id";

export default function SquadPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [voteCount, setVoteCount] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["squad", id],
    queryFn: () => getSquad(id),
  });

  useEffect(() => {
    setHasVoted(localStorage.getItem(`soheads_voted_${id}`) === "1");
  }, [id]);

  const squad = data?.squad;
  const players = data?.players ?? [];
  const cards = data?.cards ?? [];

  const slots = useMemo<Record<number, PitchSlotData | undefined>>(() => {
    if (!squad) return {};
    const playerMap = new Map(players.map((p) => [p.slug, p]));
    const cardMap = new Map(
      cards.map((c) => [`${c.player_slug}|${c.rarity}|${c.season_year}`, c]),
    );
    const result: Record<number, PitchSlotData | undefined> = {};
    for (const s of squad.squad_slots ?? []) {
      const p = playerMap.get(s.player_slug);
      const c = cardMap.get(`${s.player_slug}|${s.rarity}|${s.season_year}`);
      result[s.slot_index] = {
        player_slug: s.player_slug,
        display_name: p?.display_name ?? s.player_slug,
        picture_url: p?.picture_url ?? null,
        card_image_url: c?.card_image_url ?? null,
        rarity: s.rarity,
        season_year: s.season_year,
        in_season: s.in_season,
      };
    }
    return result;
  }, [squad, players, cards]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-[500px] animate-pulse rounded-2xl bg-card" />
      </div>
    );
  }

  if (!squad) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Squad not found</h1>
        <Link href="/" className={cn(buttonVariants(), "mt-6 rounded-full")}>
          Back home
        </Link>
      </div>
    );
  }

  const summary: Record<string, number> = {};
  (squad.squad_slots ?? []).forEach((s) => {
    const r = normaliseRarity(s.rarity);
    summary[r] = (summary[r] ?? 0) + 1;
  });

  async function onUpvote() {
    if (hasVoted) return;
    const base = squad?.votes_count ?? 0;
    setVoteCount(base + 1);
    setHasVoted(true);
    try {
      const res = await upvoteSquad(id, getDeviceId());
      setVoteCount(res.votes);
      localStorage.setItem(`soheads_voted_${id}`, "1");
      if (res.alreadyVoted) {
        toast("You've already voted on this squad");
      } else {
        toast.success("Thanks for voting");
      }
    } catch (e: any) {
      setVoteCount(null);
      setHasVoted(false);
      toast.error(e.message ?? "Failed to vote");
    }
  }

  function onShare() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: squad?.name ?? "Squad", url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{squad.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
            {squad.additional_tags?.map((t) => (
              <Badge
                key={t}
                variant="outline"
                className="rounded-full border-border/60 text-[11px] font-normal"
              >
                #{t}
              </Badge>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {Object.entries(summary).map(([r, n]) => (
              <span
                key={r}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 font-medium"
              >
                <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r])} />
                {n} {RARITY_LABEL[r] ?? r}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={onUpvote}
            variant={hasVoted ? "default" : "outline"}
            className="rounded-full"
          >
            <ChevronUp className="mr-1 h-4 w-4" />
            {voteCount ?? squad.votes_count}
          </Button>
          <Button onClick={onShare} variant="outline" className="rounded-full">
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (!squad) return;
              sessionStorage.setItem(
                "soheads:duplicate",
                JSON.stringify({
                  formation: squad.formation,
                  slots: squad.squad_slots ?? [],
                  players,
                  cards,
                }),
              );
              toast.success("Squad duplicated — finish editing");
              router.push("/build");
            }}
          >
            <Duplicate className="mr-1 h-4 w-4" />
            Duplicate squad
          </Button>
        </div>
      </div>

      <div className="mt-8">
        <Pitch formation={squad.formation as 5 | 7} slots={slots} readOnly />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight">Players</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Player</th>
                <th className="px-4 py-3 text-left font-medium">Position</th>
                <th className="px-4 py-3 text-left font-medium">Rarity</th>
                <th className="px-4 py-3 text-left font-medium">Season</th>
                <th className="px-4 py-3 text-right font-medium" />
              </tr>
            </thead>
            <tbody>
              {(squad.squad_slots ?? [])
                .slice()
                .sort((a, b) => a.slot_index - b.slot_index)
                .map((s) => {
                  const p = players.find((x) => x.slug === s.player_slug);
                  const r = normaliseRarity(s.rarity);
                  const cardImg =
                    cards.find(
                      (c) =>
                        c.player_slug === s.player_slug &&
                        c.rarity === s.rarity &&
                        c.season_year === s.season_year,
                    )?.card_image_url ??
                    cards.find((c) => c.player_slug === s.player_slug)?.card_image_url ??
                    null;
                  return (
                    <tr key={s.slot_index} className="border-t border-border/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-[34px] shrink-0 bg-muted">
                            {cardImg && (
                              <img
                                src={cardImg}
                                alt={p?.display_name ?? ""}
                                loading="lazy"
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>
                          <span className="font-medium">{p?.display_name ?? s.player_slug}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{s.position}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r])} />
                          {RARITY_LABEL[r] ?? r}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {s.season_year}
                        {s.in_season ? " · In season" : ""}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <a
                          href={`https://sorare.com/football/market/shop/manager-sales?playerSlugs=${encodeURIComponent(s.player_slug)}&rarity=${encodeURIComponent(r)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-full")}
                        >
                          Search on market
                        </a>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
