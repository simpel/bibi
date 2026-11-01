import { useId } from "react";
import { cn } from "../../lib/cn";
import type { StatPoint } from "./stat-card";
import { statCardLineVariants } from "./stat-card-variants";
import { type StatLinePoint, statLinePath } from "./stat-line-path";

const WIDTH = 100;
const HEIGHT = 40;

export type StatCardLineProps = {
  series: readonly StatPoint[];
  tone: "primary" | "good" | "bad" | "neutral";
  /** The hovered point, or `null`. */
  activeIndex: number | null;
};

function tooltipShift({ ratio }: { ratio: number }) {
  if (ratio < 0.25) return "translate-x-0";
  return ratio > 0.75 ? "-translate-x-full" : "-translate-x-1/2";
}

type StatCardHoverProps = { point: StatLinePoint; active: StatPoint };

function StatCardHover({ point, active }: StatCardHoverProps) {
  const position = { left: `${(point.x / WIDTH) * 100}%`, top: `${(point.y / HEIGHT) * 100}%` };
  return (
    <>
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-card"
        style={position}
      />
      <span
        data-slot="stat-card-tooltip"
        className={cn(
          "absolute z-20 mb-2 grid -translate-y-full gap-0.5 whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md",
          tooltipShift({ ratio: point.x / WIDTH }),
        )}
        style={position}
      >
        <span className="text-muted-foreground">{active.label}</span>
        <span className="font-medium">{active.text}</span>
      </span>
    </>
  );
}

/** The trend line with a gradient under it. Decorative: the data is in the sr-only list. */
export function StatCardLine({ series, tone }: Omit<StatCardLineProps, "activeIndex">) {
  const gradientId = useId();
  const { line, area } = statLinePath({
    values: series.map((point) => point.value),
    width: WIDTH,
    height: HEIGHT,
    padY: 6,
  });
  return (
    <div data-slot="stat-card-line" aria-hidden className={statCardLineVariants({ tone })}>
      <svg
        aria-hidden
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="size-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

export type StatCardHoverLayerProps = Pick<StatCardLineProps, "series" | "tone" | "activeIndex">;

/**
 * The hover dot and tooltip in their own layer over the line's box, above the card's text: the
 * line's layer sits under the text, so nothing inside it can rise above it.
 */
export function StatCardHoverLayer({ series, tone, activeIndex }: StatCardHoverLayerProps) {
  const { points } = statLinePath({
    values: series.map((point) => point.value),
    width: WIDTH,
    height: HEIGHT,
    padY: 6,
  });
  const point = activeIndex === null ? undefined : points[activeIndex];
  const active = activeIndex === null ? undefined : series[activeIndex];
  if (!point || !active) return null;
  return (
    <div aria-hidden className={cn(statCardLineVariants({ tone }), "z-20")}>
      <StatCardHover point={point} active={active} />
    </div>
  );
}
