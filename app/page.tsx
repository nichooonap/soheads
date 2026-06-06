"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Funnel as Filter,
  Plus,
  X,
  MagnifyingGlass as Search,
  CircleNotch as Loader2,
} from "@phosphor-icons/react";
import { listSquads } from "@/app/actions/squads";
import { searchPlayers } from "@/app/actions/sorare";
import { SquadList, type SquadListSummary } from "@/components/SquadListItem";
import { HotPlayers } from "@/components/HotPlayers";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ADDITIONAL_TAGS, COMPETITIONS, GAMEWEEKS } from "@/lib/lookups";
import { RARITY_LABEL, RARITY_ORDER } from "@/lib/rarity";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "top_all", label: "Top all time" },
  { value: "top_week", label: "Top this week" },
  { value: "top_month", label: "Top this month" },
  { value: "new", label: "New" },
] as const;

type Sort = (typeof TABS)[number]["value"];

type PickedPlayer = { slug: string; displayName: string; pictureUrl: string | null };

const PAGE_SIZE = 10;

export default function HomePage() {
  const [sort, setSort] = useState<Sort>("top_all");
  const [votesDir, setVotesDir] = useState<"asc" | "desc">("desc");
  const [competition, setCompetition] = useState<string>("");
  const [gameweek, setGameweek] = useState<string>("");
  const [rarity, setRarity] = useState<string>("");
  const [formation, setFormation] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [players, setPlayers] = useState<PickedPlayer[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      sort,
      competition: competition || null,
      gameweek: gameweek || null,
      rarity: rarity || null,
      formation: formation ? (Number(formation) as 5 | 7) : null,
      additional_tags: tags.length ? tags : null,
      player_slugs: players.length ? players.map((p) => p.slug) : null,
    }),
    [sort, competition, gameweek, rarity, formation, tags, players],
  );

  useEffect(() => {
    setPage(1);
  }, [sort, competition, gameweek, rarity, formation, tags, players, votesDir]);

  const { data, isLoading } = useQuery({
    queryKey: ["squads", params],
    queryFn: () => listSquads(params as any),
  });

  const allSquads = (data?.squads ?? []) as SquadListSummary[];
  const sortedSquads = useMemo(
    () =>
      [...allSquads].sort((a, b) =>
        votesDir === "desc" ? b.votes_count - a.votes_count : a.votes_count - b.votes_count,
      ),
    [allSquads, votesDir],
  );
  const totalPages = Math.max(1, Math.ceil(sortedSquads.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const squads = sortedSquads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCount =
    (competition ? 1 : 0) +
    (gameweek ? 1 : 0) +
    (rarity ? 1 : 0) +
    (formation ? 1 : 0) +
    tags.length +
    players.length;

  function clearAll() {
    setCompetition("");
    setGameweek("");
    setRarity("");
    setFormation("");
    setTags([]);
    setPlayers([]);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mb-10">
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Build your dream lineup.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Mix any players, any rarities, any seasons. Save it. Share it. See what the community
          votes the best.
        </p>
      </section>

      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2">
        <div className="-mx-4 flex flex-1 gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setSort(t.value)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                sort === t.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 rounded-full"
          onClick={() => setFiltersOpen(true)}
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      {activeCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {competition && <ActiveChip label={competition} onClear={() => setCompetition("")} />}
          {gameweek && <ActiveChip label={gameweek} onClear={() => setGameweek("")} />}
          {rarity && (
            <ActiveChip
              label={rarity === "mixed" ? "Mixed rarities" : RARITY_LABEL[rarity] ?? rarity}
              onClear={() => setRarity("")}
            />
          )}
          {formation && (
            <ActiveChip label={`${formation}-a-side`} onClear={() => setFormation("")} />
          )}
          {tags.map((t) => (
            <ActiveChip
              key={t}
              label={`#${t}`}
              onClear={() => setTags((prev) => prev.filter((x) => x !== t))}
            />
          ))}
          {players.map((p) => (
            <ActiveChip
              key={p.slug}
              label={p.displayName}
              onClear={() => setPlayers((prev) => prev.filter((x) => x.slug !== p.slug))}
            />
          ))}
          <button
            onClick={clearAll}
            className="text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
          >
            Clear all
          </button>
        </div>
      )}

      <FiltersDialog
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        competition={competition}
        setCompetition={setCompetition}
        gameweek={gameweek}
        setGameweek={setGameweek}
        rarity={rarity}
        setRarity={setRarity}
        formation={formation}
        setFormation={setFormation}
        tags={tags}
        setTags={setTags}
        players={players}
        setPlayers={setPlayers}
        onClearAll={clearAll}
        activeCount={activeCount}
      />

      <div className="mt-8">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl border border-border/60 bg-card" />
            ))}
          </div>
        ) : squads.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SquadList
              squads={squads}
              votesDir={votesDir}
              onToggleVotes={() => setVotesDir((d) => (d === "desc" ? "asc" : "desc"))}
            />
            {totalPages > 1 && (
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        )}
      </div>

      <HotPlayers
        selectedSlugs={players.map((p) => p.slug)}
        onToggle={(p) => {
          setPlayers((prev) =>
            prev.some((x) => x.slug === p.slug)
              ? prev.filter((x) => x.slug !== p.slug)
              : [...prev, p],
          );
        }}
      />
    </div>
  );
}

function FiltersDialog({
  open,
  onOpenChange,
  competition,
  setCompetition,
  gameweek,
  setGameweek,
  rarity,
  setRarity,
  formation,
  setFormation,
  tags,
  setTags,
  players,
  setPlayers,
  onClearAll,
  activeCount,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  competition: string;
  setCompetition: (v: string) => void;
  gameweek: string;
  setGameweek: (v: string) => void;
  rarity: string;
  setRarity: (v: string) => void;
  formation: string;
  setFormation: (v: string) => void;
  tags: string[];
  setTags: (v: string[] | ((prev: string[]) => string[])) => void;
  players: PickedPlayer[];
  setPlayers: (v: PickedPlayer[] | ((prev: PickedPlayer[]) => PickedPlayer[])) => void;
  onClearAll: () => void;
  activeCount: number;
}) {
  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Filter squads</DialogTitle>
            {activeCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {activeCount}
              </span>
            )}
          </div>
          <DialogClose />
        </DialogHeader>

        <div className="divide-y divide-border/50">
          {/* Selects */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Match filters
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <FilterSelect
                label="Competition"
                value={competition}
                onChange={setCompetition}
                options={COMPETITIONS as readonly string[]}
              />
              <FilterSelect
                label="Gameweek"
                value={gameweek}
                onChange={setGameweek}
                options={GAMEWEEKS}
              />
              <FilterSelect
                label="Rarity"
                value={rarity}
                onChange={setRarity}
                options={[...RARITY_ORDER, "mixed"] as readonly string[]}
                renderLabel={(v) => (v === "mixed" ? "Mixed" : RARITY_LABEL[v] ?? v)}
              />
              <FilterSelect
                label="Formation"
                value={formation}
                onChange={setFormation}
                options={["5", "7"]}
                renderLabel={(v) => `${v}-a-side`}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Squad tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ADDITIONAL_TAGS.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      active
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 text-foreground hover:border-foreground/50",
                    )}
                  >
                    #{t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Players */}
          <div className="px-5 py-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Must include player
            </p>
            <PlayerPicker
              selected={players}
              onAdd={(p) =>
                setPlayers((prev) => (prev.some((x) => x.slug === p.slug) ? prev : [...prev, p]))
              }
              onRemove={(slug) => setPlayers((prev) => prev.filter((x) => x.slug !== slug))}
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={onClearAll}
            className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Clear all
          </button>
          <Button onClick={() => onOpenChange(false)} className="rounded-full" size="sm">
            Show squads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlayerPicker({
  selected,
  onAdd,
  onRemove,
}: {
  selected: PickedPlayer[];
  onAdd: (p: PickedPlayer) => void;
  onRemove: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({
    queryKey: ["squad-filter-search", debounced],
    queryFn: () => searchPlayers(debounced),
    enabled: debounced.length >= 2,
  });

  const results = (data?.players ?? []).filter(
    (p) => !selected.some((s) => s.slug === p.slug),
  );

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span
              key={p.slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 py-1 pl-2.5 pr-2 text-xs font-medium"
            >
              {p.displayName}
              <button
                onClick={() => onRemove(p.slug)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/10 hover:text-foreground"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a player to require…"
          className="rounded-full border-border/60 bg-background pl-9 text-sm"
        />
      </div>

      {debounced.length >= 2 && (
        <div className="max-h-44 overflow-y-auto rounded-xl border border-border/60 bg-background">
          {isFetching ? (
            <div className="flex items-center justify-center py-5 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-5 text-center text-xs text-muted-foreground">No players found.</div>
          ) : (
            <ul className="divide-y divide-border/40">
              {results.slice(0, 8).map((p) => (
                <li key={p.slug}>
                  <button
                    onClick={() => {
                      onAdd({ slug: p.slug, displayName: p.displayName, pictureUrl: p.pictureUrl });
                      setQuery("");
                      setDebounced("");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-accent"
                  >
                    <span className="min-w-0 flex-1 truncate">{p.displayName}</span>
                    {p.position && (
                      <span className="shrink-0 rounded-full border border-border/60 px-1.5 py-0.5 text-[10px] font-semibold">
                        {p.position}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  renderLabel,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  renderLabel?: (v: string) => string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <Select value={value || "__all"} onValueChange={(v) => onChange(!v || v === "__all" ? "" : v)}>
        <SelectTrigger className="w-full rounded-lg border-border/60 bg-background text-xs">
          <SelectValue>
            {value ? (renderLabel ? renderLabel(value) : value) : "All"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {renderLabel ? renderLabel(o) : o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages: (number | "…")[] = [];
  const win = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= win) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }
  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Previous
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-sm text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={cn(
              "h-8 min-w-8 rounded-full px-2.5 text-sm font-medium transition",
              p === page
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p}
          </button>
        ),
      )}
      <Button
        variant="outline"
        size="sm"
        className="rounded-full"
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
      </Button>
    </div>
  );
}

function ActiveChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium">
      {label}
      <button onClick={onClear} className="text-muted-foreground hover:text-foreground">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-card/40 px-6 py-16 text-center">
      <h3 className="font-heading text-lg font-semibold">No squads yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Be the first to build and share a squad. It only takes a minute.
      </p>
      <Link href="/build" className={cn(buttonVariants(), "mt-5 rounded-full")}>
        <Plus className="mr-1 h-4 w-4" />
        Build the first squad
      </Link>
    </div>
  );
}
