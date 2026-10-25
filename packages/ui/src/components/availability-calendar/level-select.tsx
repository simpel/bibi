"use client";

import { useState } from "react";
import { Popover, PopoverAnchor } from "../popover/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select/select";
import { useCalendarLabels } from "./calendar-labels";
import { CustomRange } from "./custom-range";
import { CHOICES, type RangeToolbarProps } from "./range-toolbar";
import type { TimelineLevel } from "./timeline-scale";

export type LevelSelectProps = Pick<RangeToolbarProps, "choice" | "shown" | "onLevel" | "onCustom">;

/** Day, week, month or custom as one dropdown, for a calendar too narrow for the tabs. */
export function LevelSelect({ choice, shown, onLevel, onCustom }: LevelSelectProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const labels = useCalendarLabels();
  return (
    <Popover open={customOpen} onOpenChange={setCustomOpen}>
      <PopoverAnchor asChild>
        <div>
          <Select
            value={choice}
            onValueChange={(value) =>
              value === "custom" ? setCustomOpen(true) : onLevel(value as TimelineLevel)
            }
          >
            <SelectTrigger aria-label={labels.range} className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHOICES.map((value) => (
                <SelectItem key={value} value={value}>
                  {labels.levels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
