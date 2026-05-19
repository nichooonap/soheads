"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass as Search, CircleNotch as Loader2, ArrowLeft, Check } from "@phosphor-icons/react";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { searchPlayers, getPlayerCards, getPopularPlayers, type CardVariant } from "@/app/actions/sorare";
import { RARITY_LABEL, normaliseRarity, RARITY_DOT } from "@/lib/rarity";
import { cn } from "@/lib/utils";

type SelectedPayload = {
  player_slug: string;
  display_name: string;
  picture_url: string | null;
  card_image_url: string | null;
  rarity: string;
  season_year: number;
  in_season: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  position: string;
  onSelect: (data: SelectedPayload) => void;
};

type PlayerSummary = Awaited<ReturnType<typeof searchPlayers>>["players"][number];

export function PlayerOverlay({ open, onClose, position, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [picked, setPicked] = useState<PlayerSummary | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
      setPicked(null);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["search", position, debounced],
    queryFn: () => searchPlayers(debounced, position),
    enabled: debounced.length >= 2,
  });

  const { data: popularData, isLoading: popularLoading } = useQuery({
    queryKey: ["popular", position],
    queryFn: () => getPopularPlayers(position),
    enabled: open && debounced.length < 2,
    staleTime: 1000 * 60 * 60,
  });

  const isSearching = debounced.length >= 2;
  const players = isSearching ? data?.players ?? [] : popularData?.players ?? [];
  const loading = isSearching ? isFetching : popularLoading;

  return (
    <Drawer open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DrawerContent className="max-h-[90vh] border-border/60 bg-card p-0">
        <DrawerTitle className="sr-only">
          {picked ? `Choose card for ${picked.displayName}` : `Select ${position} player`}
        </DrawerTitle>

        {!picked ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border/60 p-4 pr-12">
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold tracking-wider text-primary">
                {position}
              </span>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any player…"
                  className="rounded-full border-border/60 bg-background pl-9"
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!isSearching && (
                <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Popular {position} players
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : players.length === 0 ? (
                <div className="px-4 py-12 text-center text-sm text-muted-foreground">
                  {isSearching ? "No players found." : "No suggestions yet — try searching."}
                </div>
              ) : (
                <ul className="divide-y divide-border/40">
                  {players.map((p) => (
                    <li key={p.slug}>
                      <button
                        onClick={() => setPicked(p)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-accent"
                      >
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {p.pictureUrl && (
                            <img src={p.pictureUrl} alt={p.displayName} className="h-full w-full object-cover object-top" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium">{p.displayName}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {[p.team, p.league].filter(Boolean).join(" · ") || "—"}
                          </div>
                        </div>
                        {p.position && (
                          <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] font-semibold">
                            {p.position}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <CardPicker
            player={picked}
            slotPosition={position}
            onBack={() => setPicked(null)}
            onConfirm={(card) => {
              onSelect({
                player_slug: picked.slug,
                display_name: picked.displayName,
                picture_url: picked.pictureUrl,
                card_image_url: card.cardImageUrl,
                rarity: card.rarity,
                season_year: card.seasonYear,
                in_season: card.inSeason,
              });
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function CardPicker({
  player,
  slotPosition,
  onBack,
  onConfirm,
}: {
  player: PlayerSummary;
  slotPosition: string;
  onBack: () => void;
  onConfirm: (card: CardVariant) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["player-cards", player.slug],
    queryFn: () => getPlayerCards(player.slug),
  });

  const POSITION_MAP: Record<string, string[]> = {
    GK: ["Goalkeeper"],
    DF: ["Defender"],
    MD: ["Midfielder"],
    FW: ["Forward"],
    EX: ["Defender", "Midfielder", "Forward"],
  };
  const allowedSorarePositions = POSITION_MAP[slotPosition] ?? [];

  const allCards = (data?.cards ?? []).filter((c) => {
    if (!allowedSorarePositions.length) return true;
    if (!c.position) return true; // unknown — keep
    return allowedSorarePositions.includes(c.position);
  });

  const [picked, setPicked] = useState<CardVariant | null>(null);
  const [seasonMode, setSeasonMode] = useState<"in_season" | "classic">("in_season");
  const [rarity, setRarity] = useState<string>("limited");

  // Available rarities for this player+position (sorted by canonical order).
  const rarityOrder = ["common", "limited", "rare", "super_rare", "unique"];
  const availableRarities = rarityOrder.filter((r) =>
    allCards.some((c) => normaliseRarity(c.rarity) === r),
  );

  // Auto-pick first available rarity if current isn't available.
  useEffect(() => {
    if (availableRarities.length && !availableRarities.includes(rarity)) {
      setRarity(availableRarities[0]);
    }
  }, [availableRarities.join(","), rarity]);

  const filtered = allCards.filter((c) => {
    if (normaliseRarity(c.rarity) !== rarity) return false;
    return seasonMode === "in_season" ? c.inSeason : !c.inSeason;
  });

  // Reset pick when filters change and current pick is no longer visible.
  useEffect(() => {
    if (picked && !filtered.some((c) => c.rarity === picked.rarity && c.seasonYear === picked.seasonYear)) {
      setPicked(null);
    }
  }, [seasonMode, rarity]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/60 p-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
          {player.pictureUrl && (
            <img src={player.pictureUrl} alt={player.displayName} className="h-full w-full object-cover object-top" />
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold">{player.displayName}</div>
          <div className="truncate text-xs text-muted-foreground">
            {[player.team, player.league].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      {!isLoading && allCards.length > 0 && (
        <div className="space-y-3 border-b border-border/60 px-4 py-3">
          <div className="inline-flex w-full rounded-full border border-border/60 bg-background p-0.5">
            {(["in_season", "classic"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSeasonMode(m)}
                className={cn(
                  "flex-1 rounded-full px-3 py-1.5 text-xs font-medium transition",
                  seasonMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {m === "in_season" ? "In Season" : "Classic"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableRarities.map((r) => (
              <button
                key={r}
                onClick={() => setRarity(r)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  rarity === r
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border/60 text-muted-foreground hover:border-border",
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r] ?? "bg-muted-foreground")} />
                {RARITY_LABEL[r] ?? r}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-h-[45vh] overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : allCards.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No {slotPosition} cards available for this player.
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No {seasonMode === "in_season" ? "In Season" : "Classic"} {RARITY_LABEL[rarity] ?? rarity} cards.
          </div>
        ) : (
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3 sm:max-w-xl sm:grid-cols-4">
            {filtered.map((c) => {
              const r = normaliseRarity(c.rarity);
              const isPicked =
                picked && picked.rarity === c.rarity && picked.seasonYear === c.seasonYear;
              return (
                <button
                  key={`${c.rarity}-${c.seasonYear}-${c.position ?? ""}`}
                  onClick={() => setPicked(c)}
                  className={cn(
                    "group flex flex-col gap-1.5 rounded-xl border p-2 text-left transition",
                    isPicked
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-border",
                  )}
                >
                  <div className="relative aspect-[5/7] w-full">
                    {c.cardImageUrl ? (
                      <img
                        src={c.cardImageUrl}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        no image
                      </div>
                    )}
                    {isPicked && (
                      <div className="absolute right-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r])} />
                    <span className="text-[11px] font-medium">{RARITY_LABEL[r] ?? c.rarity}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {c.seasonYear} {c.inSeason && "· In Season"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-border/60 p-4">
        <Button
          className="w-full rounded-full"
          disabled={!picked}
          onClick={() => picked && onConfirm(picked)}
        >
          Add to squad
        </Button>
      </div>
    </div>
  );
}
