import { Plus, X } from "@phosphor-icons/react";
import { getFormation, type Slot } from "@/lib/formations";
import { cn } from "@/lib/utils";



export type PitchSlotData = {
  player_slug: string;
  display_name: string;
  picture_url: string | null;
  card_image_url: string | null;
  rarity: string;
  season_year: number;
  in_season: boolean;
};

type Props = {
  formation: 5 | 7;
  slots: Record<number, PitchSlotData | undefined>;
  onSlotClick?: (slot: Slot) => void;
  onSlotRemove?: (slot: Slot) => void;
  readOnly?: boolean;
};

export function Pitch({ formation, slots, onSlotClick, onSlotRemove, readOnly }: Props) {
  const layout = getFormation(formation);

  return (
    <div className="relative mx-auto aspect-[3/4] w-full max-w-[520px] overflow-hidden rounded-3xl border border-border/60 bg-pitch shadow-[inset_0_0_60px_-10px_rgba(0,0,0,0.6)] md:aspect-[16/10] md:max-w-[900px]">
      <picture className="pointer-events-none absolute inset-0 h-full w-full">
        <source media="(min-width: 768px)" srcSet="/assets/pitch-desktop.png" />
        <img
          src="/assets/pitch-mobile.png"
          alt=""
          aria-hidden
          className="h-full w-full object-cover"
        />
      </picture>

      {layout.map((slot) => {
        const data = slots[slot.index];
        return (
          <div
            key={slot.index}
            className="absolute -translate-x-1/2 translate-y-1/2"
            style={{ left: `${slot.x}%`, bottom: `${slot.y}%` }}
          >
            <button
              type="button"
              disabled={readOnly}
              onClick={() => onSlotClick?.(slot)}
              className={cn(
                "transition",
                !readOnly && "hover:scale-105 active:scale-95",
                readOnly && "cursor-default",
              )}
              aria-label={`${slot.position} slot`}
            >
              {data ? (
                <FilledSlot data={data} position={slot.position} />
              ) : (
                <EmptySlot position={slot.position} />
              )}
            </button>
            {data && !readOnly && onSlotRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotRemove(slot);
                }}
                aria-label={`Remove ${data.display_name}`}
                className="absolute -right-1 -top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-md transition hover:bg-destructive hover:text-destructive-foreground active:scale-90"
              >
                <X className="h-3.5 w-3.5" weight="bold" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PitchLines() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full text-pitch-line"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.4"
    >
      <rect x="2" y="2" width="96" height="96" rx="2" />
      <line x1="2" y1="50" x2="98" y2="50" />
      <circle cx="50" cy="50" r="9" />
      <rect x="30" y="2" width="40" height="14" />
      <rect x="30" y="84" width="40" height="14" />
      <rect x="40" y="2" width="20" height="6" />
      <rect x="40" y="92" width="20" height="6" />
    </svg>
  );
}

function EmptySlot({ position }: { position: string }) {
  return (
    <div className="flex w-[68px] flex-col items-center gap-1 sm:w-[80px]">
      <div className="flex aspect-[5/7] w-full items-center justify-center rounded-xl border-2 border-dashed border-foreground/30 bg-background/20 backdrop-blur-sm">
        <Plus className="h-5 w-5 text-foreground/60" />
      </div>
      <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-semibold tracking-wider">
        {position}
      </span>
    </div>
  );
}

function FilledSlot({
  data,
  position,
}: {
  data: PitchSlotData;
  position: string;
}) {
  const img = data.card_image_url ?? data.picture_url;
  return (
    <div className="flex w-[68px] flex-col items-center gap-1 sm:w-[80px]">
      <div className="relative aspect-[5/7] w-full">
        {img ? (
          <img
            src={img}
            alt={data.display_name}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/20 text-[10px] text-white/70">
            {data.display_name.slice(0, 2)}
          </div>
        )}
      </div>
      <span className="rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-semibold tracking-wider">
        {position}
      </span>
    </div>
  );
}
