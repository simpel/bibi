import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

/**
 * The green ring of something happening now, with a light running slowly round it. Placed inside
 * a `relative` card with rounded corners; it takes the card's corners and lets clicks through.
 */
const RING: CSSProperties = {
  background:
    // The Live badge's two greens: its pale fill all round, its strong green as the moving light.
    "conic-gradient(from var(--live-angle), color-mix(in oklch, var(--success) 15%, transparent) 0deg 220deg, var(--success) 300deg, color-mix(in oklch, var(--success) 15%, transparent) 360deg)",
  mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
};

export type LiveBorderProps = { className?: string };

export function LiveBorder({ className }: LiveBorderProps) {
  return (
    <span
      aria-hidden
      data-slot="live-border"
      style={RING}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] p-0.5 motion-safe:animate-live-shimmer",
        className,
      )}
    />
  );
}

export type LiveBadgeProps = { label: string; className?: string };

/** "Live" beside a card's icons: a green badge with a pulsing dot. */
export function LiveBadge({ label, className }: LiveBadgeProps) {
  return (
    <span
      data-slot="live-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-success/15 px-1.5 py-0.5 font-semibold text-[10px] text-success uppercase tracking-wide",
        className,
      )}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-success motion-safe:animate-pulse" />
      {label}
    </span>
  );
}
