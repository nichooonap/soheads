"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pitch, type PitchSlotData } from "@/components/Pitch";
import { PlayerOverlay } from "@/components/PlayerOverlay";
import { Button } from "@/components/ui/button";
import { buildBus } from "@/lib/build-bus";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFormation, type Slot } from "@/lib/formations";
import { ADDITIONAL_TAGS, COMPETITIONS, GAMEWEEKS } from "@/lib/lookups";
import { RARITY_DOT, RARITY_LABEL, normaliseRarity } from "@/lib/rarity";
import { cn } from "@/lib/utils";
import { createSquad } from "@/app/actions/squads";
import { getDeviceId } from "@/lib/device-id";

export default function BuildPage() {
  const router = useRouter();
  const [formation, setFormation] = useState<5 | 7>(5);
  const [slots, setSlots] = useState<Record<number, PitchSlotData | undefined>>({});
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);

  const layout = getFormation(formation);
  const filledCount = layout.filter((s) => slots[s.index]).length;
  const isComplete = filledCount === formation;

  const summary = useMemo(() => {
    const rarities: Record<string, number> = {};
    layout.forEach((s) => {
      const data = slots[s.index];
      if (!data) return;
      const r = normaliseRarity(data.rarity);
      rarities[r] = (rarities[r] ?? 0) + 1;
    });
    return rarities;
  }, [slots, layout]);

  function changeFormation(n: 5 | 7) {
    if (n === formation) return;
    if (Object.keys(slots).length > 0) {
      if (!confirm("Changing formation will clear your squad. Continue?")) return;
    }
    setSlots({});
    setFormation(n);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("soheads:duplicate");
    if (!raw) return;
    sessionStorage.removeItem("soheads:duplicate");
    try {
      const payload = JSON.parse(raw) as {
        formation: number;
        slots: Array<{
          slot_index: number;
          player_slug: string;
          rarity: string;
          season_year: number;
          in_season: boolean;
        }>;
        players: Array<{ slug: string; display_name: string; picture_url: string | null }>;
        cards: Array<{
          player_slug: string;
          rarity: string;
          season_year: number;
          card_image_url: string | null;
        }>;
      };
      const playerMap = new Map(payload.players.map((p) => [p.slug, p]));
      const cardMap = new Map(
        payload.cards.map((c) => [`${c.player_slug}|${c.rarity}|${c.season_year}`, c]),
      );
      const next: Record<number, PitchSlotData | undefined> = {};
      for (const s of payload.slots) {
        const p = playerMap.get(s.player_slug);
        const c = cardMap.get(`${s.player_slug}|${s.rarity}|${s.season_year}`);
        next[s.slot_index] = {
          player_slug: s.player_slug,
          display_name: p?.display_name ?? s.player_slug,
          picture_url: p?.picture_url ?? null,
          card_image_url: c?.card_image_url ?? null,
          rarity: s.rarity,
          season_year: s.season_year,
          in_season: s.in_season,
        };
      }
      setFormation(payload.formation as 5 | 7);
      setSlots(next);
    } catch {
      /* ignore malformed prefill */
    }
  }, []);

  useEffect(() => {
    buildBus.setCanSave(isComplete);
    return () => buildBus.setCanSave(false);
  }, [isComplete]);

  useEffect(() => {
    const handler = () => {
      if (isComplete) setSaveOpen(true);
    };
    window.addEventListener("soheads:request-save", handler);
    return () => window.removeEventListener("soheads:request-save", handler);
  }, [isComplete]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-full border border-border/60 bg-card p-1">
          {[5, 7].map((n) => (
            <button
              key={n}
              onClick={() => changeFormation(n as 5 | 7)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition",
                formation === n ? "bg-foreground text-background" : "text-muted-foreground",
              )}
            >
              {n}-a-side
            </button>
          ))}
        </div>

        <div className="flex flex-col items-end gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium">
            {filledCount}/{formation} players
          </span>
          {Object.entries(summary).length > 0 && (
            <div className="flex flex-wrap justify-end gap-1.5">
              {Object.entries(summary).map(([r, n]) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                >
                  <span className={cn("h-2 w-2 rounded-full", RARITY_DOT[r])} />
                  {n} {RARITY_LABEL[r] ?? r}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Pitch
          formation={formation}
          slots={slots}
          onSlotClick={(s) => setActiveSlot(s)}
          onSlotRemove={(s) =>
            setSlots((prev) => {
              const next = { ...prev };
              delete next[s.index];
              return next;
            })
          }
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Tap a placeholder to add a player.
      </p>

      <PlayerOverlay
        open={!!activeSlot}
        position={activeSlot?.position ?? ""}
        onClose={() => setActiveSlot(null)}
        onSelect={(payload) => {
          if (activeSlot) {
            setSlots((prev) => ({ ...prev, [activeSlot.index]: payload }));
          }
          setActiveSlot(null);
        }}
      />

      <SaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSave={async (meta) => {
          try {
            const slotsPayload = layout.map((slot) => {
              const d = slots[slot.index]!;
              return {
                slot_index: slot.index,
                position: slot.position,
                player_slug: d.player_slug,
                rarity: d.rarity,
                season_year: d.season_year,
                in_season: d.in_season,
              };
            });
            const res = await createSquad({
              name: meta.name,
              formation,
              competition_tag: meta.competition || null,
              gameweek_tag: meta.gameweek || null,
              additional_tags: meta.additionalTags,
              device_id: getDeviceId(),
              slots: slotsPayload,
            });
            toast.success("Squad saved");
            router.push(`/squad/${res.id}`);
          } catch (e: any) {
            toast.error(e.message ?? "Failed to save squad");
          }
        }}
      />
    </div>
  );
}

function SaveDialog({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (m: {
    name: string;
    competition: string;
    gameweek: string;
    additionalTags: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [competition, setCompetition] = useState("");
  const [gameweek, setGameweek] = useState("");
  const [additionalTags, setAdditionalTags] = useState<string[]>([]);

  const mut = useMutation({
    mutationFn: () =>
      onSave({
        name: name.trim(),
        competition,
        gameweek,
        additionalTags,
      }),
  });

  function toggleTag(t: string) {
    setAdditionalTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 4 ? prev : [...prev, t],
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="border-border/60 bg-card">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save your squad</DrawerTitle>
          </DrawerHeader>

          <div className="space-y-4 px-4 pb-2">
            <div>
              <Label htmlFor="name">Squad name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. GW7 bangers"
                maxLength={80}
                className="mt-1.5 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Competition</Label>
                <Select value={competition} onValueChange={(v) => setCompetition(v ?? "")}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPETITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gameweek</Label>
                <Select value={gameweek} onValueChange={(v) => setGameweek(v ?? "")}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {GAMEWEEKS.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Additional tags</Label>
              <p className="mt-1 text-xs text-muted-foreground">Pick up to 4 to describe the vibe.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ADDITIONAL_TAGS.map((t) => {
                  const active = additionalTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition",
                        active
                          ? "border-foreground bg-foreground text-background"
                          : "border-border/60 text-foreground hover:border-foreground/60",
                      )}
                    >
                      #{t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DrawerFooter className="flex-row justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={!name.trim() || mut.isPending}
              onClick={() => mut.mutate()}
              className="rounded-full"
            >
              {mut.isPending ? "Saving…" : "Save squad"}
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
