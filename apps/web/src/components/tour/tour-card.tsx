"use client";

import { Button } from "@bibi/ui";
import { useEffect, useRef } from "react";

export type TourLabels = {
  skip: string;
  back: string;
  next: string;
  done: string;
  /** "Step {current} of {total}": the placeholders are filled in here. */
  progress: string;
};

export type TourCardProps = {
  title: string;
  body: string;
  index: number;
  total: number;
  labels: TourLabels;
  style: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

/** One step's popover: what the element is, where we are, and Skip, Back and Next. */
export function TourCard({
  title,
  body,
  index,
  total,
  labels,
  style,
  onBack,
  onNext,
  onSkip,
}: TourCardProps) {
  const next = useRef<HTMLButtonElement>(null);
  const last = index === total - 1;
  useEffect(() => {
    // Keyboard focus lands on Next when a step opens (the card is keyed by step), so Enter moves on.
    next.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div
      role="dialog"
      aria-label={title}
      style={style}
      className="fixed z-[70] grid w-80 max-w-[calc(100vw-1.5rem)] gap-3 rounded-lg border bg-popover p-4 text-popover-foreground shadow-lg"
    >
      <div className="grid gap-1">
        <p className="text-xs text-muted-foreground tabular-nums">
          {labels.progress
            .replace("{current}", String(index + 1))
            .replace("{total}", String(total))}
        </p>
        <h2 className="font-serif text-lg leading-snug">{title}</h2>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onSkip}>
          {labels.skip}
        </Button>
        <div className="flex items-center gap-2">
          {index > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={onBack}>
              {labels.back}
            </Button>
          ) : null}
          <Button ref={next} type="button" size="sm" onClick={onNext}>
            {last ? labels.done : labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
