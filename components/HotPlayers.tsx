"use client";

import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { getHotPlayers } from "@/app/actions/squads";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Player = {
  slug: string;
  display_name: string;
  position: string | null;
  team_name: string | null;
  picture_url: string | null;
  card_image_url: string | null;
  uses: number;
};

export function HotPlayers({
  selectedSlugs,
  onToggle,
}: {
  selectedSlugs: string[];
  onToggle: (p: { slug: string; displayName: string; pictureUrl: string | null }) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["hot-players"],
    queryFn: () => getHotPlayers(),
  });

  const players = (data?.players ?? []) as Player[];

  function scroll(dir: -1 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (!isLoading && players.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Hot cards</h2>
          <p className="text-xs text-muted-foreground">
            Players showing up in the most squads. Tap to filter.
          </p>
        </div>
        <div className="hidden gap-1 sm:flex">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll(-1)}>
            <CaretLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => scroll(1)}>
            <CaretRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-44 w-28 shrink-0 animate-pulse border border-border/60 bg-card"
              />
            ))
          : players.map((p) => {
              const active = selectedSlugs.includes(p.slug);
              return (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() =>
                    onToggle({
                      slug: p.slug,
                      displayName: p.display_name,
                      pictureUrl: p.picture_url,
                    })
                  }
                  className={cn(
                    "group flex w-28 shrink-0 snap-start flex-col gap-1.5 border bg-card p-1.5 text-left transition hover:border-primary/60 sm:w-32",
                    active ? "border-primary ring-2 ring-primary/40" : "border-border/60",
                  )}
                >
                  <div className="relative aspect-[5/7] w-full">
                    {p.card_image_url ? (
                      <img
                        src={p.card_image_url}
                        alt={p.display_name}
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        no card
                      </div>
                    )}
                    <span className="absolute right-1 top-1 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur">
                      ×{p.uses}
                    </span>
                  </div>
                  <div className="px-0.5">
                    <div className="truncate text-xs font-semibold leading-tight">
                      {p.display_name}
                    </div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {p.position ?? ""}
                      {p.team_name ? ` · ${p.team_name}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
