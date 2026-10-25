"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../../components/button/button";
import { Popover, PopoverAnchor } from "../../components/popover/popover";
import { Tabs, TabsList, TabsTrigger } from "../../components/tabs/tabs";
import { CustomRange } from "./custom-range";
import type { TimelineLevel } from "./timeline-scale";

export type RangeChoice = TimelineLevel | "custom";

export type RangeToolbarProps = {
  /** The level nearest the zoom, or custom while a custom range is untouched. */
  choice: RangeChoice;
  /** First and last day on screen, inclusive. */
  shown: { from: string; to: string };
  /** The days on screen in the user's date format. */
  label: string;
  onLevel: (level: TimelineLevel) => void;
  onStep: (direction: -1 | 1) => void;
  onToday: () => void;
  onCustom: (range: { from: string; to: string }) => void;
};

export const CHOICES: readonly { value: RangeChoice; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "custom", label: "Custom" },
];

/** Day, week and month set the zoom; custom asks for two dates. Full width on a phone. */
function RangeTabs({ choice, shown, onLevel, onCustom }: RangeToolbarProps) {
  const [customOpen, setCustomOpen] = useState(false);
  return (
    <Popover open={customOpen} onOpenChange={setCustomOpen}>
      <PopoverAnchor asChild>
        <Tabs
          value={choice}
          onValueChange={(value) => (value === "custom" ? null : onLevel(value as TimelineLevel))}
          className="min-w-0"
        >
          <TabsList>
            {CHOICES.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                onClick={() => (value === "custom" ? setCustomOpen(true) : null)}
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </PopoverAnchor>
      {customOpen ? (
        <CustomRange
          {...shown}
          onApply={(range) => {
            setCustomOpen(false);
            onCustom(range);
          }}
        />
      ) : null}
    </Popover>
  );
}

export type RangeStepperProps = Pick<RangeToolbarProps, "onStep" | "onToday"> & { label?: string };

/** Earlier, today, later, and the days on screen in words when there is room for them. */
export function RangeStepper({ label, onStep, onToday }: RangeStepperProps) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      <Button variant="outline" size="icon" aria-label="Earlier" onClick={() => onStep(-1)}>
        <ChevronLeftIcon aria-hidden />
      </Button>
      <Button variant="outline" onClick={onToday}>
        Today
      </Button>
      <Button variant="outline" size="icon" aria-label="Later" onClick={() => onStep(1)}>
        <ChevronRightIcon aria-hidden />
      </Button>
      {label ? (
        <p aria-live="polite" className="ml-2 truncate text-sm font-medium tabular-nums">
          {label}
        </p>
      ) : null}
    </div>
  );
}

/**
 * How much time to show, and where, as one block. The tabs set the zoom; a pinch or ctrl-scroll
 * moves the highlight along. A narrow calendar uses `CompactToolbar` instead.
 */
export function RangeToolbar(props: RangeToolbarProps) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <RangeTabs {...props} />
      <RangeStepper {...props} />
    </div>
  );
}
