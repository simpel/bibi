"use client";

import { useState } from "react";
import { Button } from "../button/button";
import { Input } from "../input/input";
import { Label } from "../label/label";
import { PopoverContent, PopoverHeader, PopoverTitle } from "../popover/popover";
import { useCalendarLabels } from "./calendar-labels";

export type CustomRangeProps = {
  /** The days on screen now: the form starts from them. */
  from: string;
  to: string;
  /** Fits the range into the track; `to` is inclusive. */
  onApply: (range: { from: string; to: string }) => void;
};

/** Two dates, first and last day; the timeline fits them and picks the detail from the length. */
export function CustomRange({ from, to, onApply }: CustomRangeProps) {
  const [draft, setDraft] = useState({ from, to });
  const labels = useCalendarLabels();
  const valid = draft.from !== "" && draft.to !== "" && draft.from <= draft.to;
  return (
    <PopoverContent align="start" className="w-[min(18rem,calc(100vw-2rem))]">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) onApply(draft);
        }}
      >
        <PopoverHeader>
          <PopoverTitle>{labels.customRange}</PopoverTitle>
        </PopoverHeader>
        <div className="grid grid-cols-2 gap-2">
          {(["from", "to"] as const).map((key) => (
            <div key={key} className="grid gap-1.5">
              <Label htmlFor={`range-${key}`}>
                {key === "from" ? labels.firstDay : labels.lastDay}
              </Label>
              <Input
                id={`range-${key}`}
                type="date"
                value={draft[key]}
                onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
              />
            </div>
          ))}
        </div>
        <Button type="submit" size="sm" disabled={!valid}>
          {labels.showRange}
        </Button>
      </form>
    </PopoverContent>
  );
}
