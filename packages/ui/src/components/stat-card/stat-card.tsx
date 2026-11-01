"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Card } from "../card/card";
import { StatCardLine } from "./stat-card-line";
import {
  statCardDotVariants,
  statCardLabelVariants,
  statCardsVariants,
  statCardTrendVariants,
  statCardVariants,
} from "./stat-card-variants";
import { useStatHover } from "./use-stat-hover";

export type StatPoint = {
  /** The bucket, e.g. "3 Nov". */
  label: string;
  value: number;
  /** The formatted value, e.g. "12 400 kr". */
  text: string;
};

export type StatTrend = {
  direction: "up" | "down" | "flat";
  /** Colour: good is green, bad is red, neutral is muted. */
  tone: "good" | "bad" | "neutral";
  /** Already formatted, e.g. "+12 %". */
  text: string;
  /** Accessible and tooltip text, e.g. "vs. previous 30 days". */
  description?: string;
};

export type StatCardProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  /** Native title on the card; defaults to the label. */
  description?: string;
  /** The dot before the label, same colours as `MoneyTotals`. */
  tone?: "neutral" | "positive" | "pending" | "negative";
  /** The stat number; the caller renders it (`MoneyNumberFlow`, plain text). */
  value: ReactNode;
  hint?: string;
  /** The background line; fewer than two points draws none. */
  series?: readonly StatPoint[];
  /** Bottom right; `null` or `undefined` shows nothing there. */
  trend?: StatTrend | null;
};

const trendIcons = { up: TrendingUp, down: TrendingDown, flat: Minus };

type StatCardFooterProps = { hint: string | undefined; trend: StatTrend | null | undefined };

function StatCardFooter({ hint, trend }: StatCardFooterProps) {
  const TrendIcon = trend ? trendIcons[trend.direction] : null;
  return (
    <div className="relative z-10 flex min-h-4 items-end gap-2">
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      {trend && TrendIcon ? (
        <span className={statCardTrendVariants({ tone: trend.tone })} title={trend.description}>
          <TrendIcon aria-hidden className="size-3.5" />
          {trend.text}
          {trend.description ? <span className="sr-only"> {trend.description}</span> : null}
        </span>
      ) : null}
    </div>
  );
}

/** The series as text, so the data is reachable without the pointer. */
function StatCardSummary({ series }: { series: readonly StatPoint[] }) {
  return (
    <ul className="sr-only">
      {series.map((point) => (
        <li key={point.label}>{`${point.label}: ${point.text}`}</li>
      ))}
    </ul>
  );
}

/** A headline figure with a background trend line, a hover tooltip and the trend at the bottom right. */
export function StatCard({
  label,
  description,
  tone = "neutral",
  value,
  hint,
  series = [],
  trend,
  className,
  ...props
}: StatCardProps) {
  const hasLine = series.length >= 2;
  const { index, handlers } = useStatHover({ count: hasLine ? series.length : 0 });
  return (
    <Card
      data-slot="stat-card"
      title={description ?? label}
      className={cn(statCardVariants(), className)}
      {...handlers}
      {...props}
    >
      {hasLine ? (
        <StatCardLine series={series} tone={trend?.tone ?? "primary"} activeIndex={index} />
      ) : null}
      <div className={statCardLabelVariants()}>
        <span aria-hidden className={statCardDotVariants({ tone })} />
        <span className="truncate">{label}</span>
      </div>
      <div className="relative z-10 whitespace-nowrap font-serif text-2xl font-light tracking-tight tabular-nums">
        {value}
      </div>
      <StatCardFooter hint={hint} trend={trend} />
      {hasLine ? <StatCardSummary series={series} /> : null}
    </Card>
  );
}

/** Grid of stat cards: equal columns that wrap. */
export function StatCards({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="stat-cards" className={cn(statCardsVariants(), className)} {...props} />;
}
