"use client";

import { cn } from "../../lib/cn";
import { LiveBorder } from "../live-border/live-border";
import { type CardSurface, cardSurfaceProps } from "./booking-tone";
import { LegendItem } from "./legend-item";

/** One legend entry's words: its name, then what it means. */
export type CardLegendEntry = { name: string; text: string };

export type CardLegendLabels = {
  /** Only where a card shows it: a table row has no fill to leave out. */
  following?: CardLegendEntry | undefined;
  done: CardLegendEntry;
  blocked: CardLegendEntry;
  fix: CardLegendEntry;
  /** Only where cards pulse while they happen (My work). */
  live?: CardLegendEntry | undefined;
};

export type CardLegendProps = {
  labels: CardLegendLabels;
  /** A muted word before the entries, e.g. "Cards:". */
  title?: string | undefined;
  className?: string;
};

const ATTENTION: readonly { key: "blocked" | "fix"; attention: "error" | "warning" }[] = [
  { key: "blocked", attention: "error" },
  { key: "fix", attention: "warning" },
];

const SURFACES: readonly { key: "following" | "done"; surface: CardSurface }[] = [
  { key: "following", surface: { following: true } },
  { key: "done", surface: { done: true } },
];

/**
 * What a card's cues mean (spec: home, Tone), one word each with the meaning on hover, drawn with
 * the cards' own badges and surfaces so the legend always matches them: the preliminary badge,
 * following and past, the red and amber dashed border, and Live.
 */
export function CardLegend({ labels, title, className }: CardLegendProps) {
  return (
    <ul
      data-slot="card-legend"
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      {title ? <li>{title}</li> : null}
      {SURFACES.map(({ key, surface }) => {
        const entry = labels[key];
        if (!entry) return null;
        const look = cardSurfaceProps({ surface });
        return (
          <LegendItem key={key} name={entry.name} text={entry.text}>
            <span
              aria-hidden
              className={cn(
                "h-5 w-8 rounded-md border bg-card shadow-sm",
                look.className,
                key === "done" && "border",
              )}
            />
          </LegendItem>
        );
      })}
      {ATTENTION.map(({ key, attention }) => {
        const look = cardSurfaceProps({ surface: { attention } });
        return (
          <LegendItem key={key} name={labels[key].name} text={labels[key].text}>
            <span
              aria-hidden
              className={cn("h-5 w-8 rounded-md border bg-card shadow-sm", look.className)}
            />
          </LegendItem>
        );
      })}
      {labels.live ? (
        <LegendItem name={labels.live.name} text={labels.live.text}>
          <span aria-hidden className="relative h-5 w-8 rounded-md bg-card shadow-sm">
            <LiveBorder />
          </span>
        </LegendItem>
      ) : null}
    </ul>
  );
}
