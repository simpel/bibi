"use client";

import { useState } from "react";
import { Button } from "../../components/button/button";
import { Input } from "../../components/input/input";
import { Label } from "../../components/label/label";
import { PopoverContent, PopoverHeader, PopoverTitle } from "../../components/popover/popover";

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
          <PopoverTitle>Custom range</PopoverTitle>
        </PopoverHeader>
        <div className="grid grid-cols-2 gap-2">
          {(["from", "to"] as const).map((key) => (
            <div key={key} className="grid gap-1.5">
              <Label htmlFor={`range-${key}`}>{key === "from" ? "First day" : "Last day"}</Label>
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
          Show range
        </Button>
      </form>
    </PopoverContent>
  );
}
