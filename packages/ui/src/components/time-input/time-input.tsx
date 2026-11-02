"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { ClockIcon } from "lucide-react";
import {
  type ChangeEvent,
  type ComponentProps,
  type FocusEvent,
  type KeyboardEvent,
  useState,
} from "react";
import { cn } from "../../lib/cn";
import { parseTimeText, stepTime } from "./time-text";

export const timeInputVariants = cva(
  "flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50 has-[input[aria-invalid=true]]:border-destructive",
  {
    variants: { width: { auto: "w-28", full: "w-full" } },
    defaultVariants: { width: "auto" },
  },
);

export type TimeInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> &
  VariantProps<typeof timeInputVariants> & {
    /** `HH:mm`, or what the person typed when it is not a time yet (the form flags it). */
    value: string;
    onValueChange: (value: string) => void;
    /** Minutes ArrowUp and ArrowDown move the time by. */
    stepMinutes?: number;
  };

type KeyInput = { event: KeyboardEvent<HTMLInputElement>; value: string; step: number };

/** ArrowUp/ArrowDown step the time; anything else types. */
function steppedValue({ event, value, step }: KeyInput): string | null {
  if (event.key === "ArrowUp") return stepTime({ value, minutes: step });
  if (event.key === "ArrowDown") return stepTime({ value, minutes: -step });
  return null;
}

type HandlersInput = Pick<TimeInputProps, "value" | "onValueChange" | "onBlur" | "onKeyDown"> & {
  step: number;
};

/** The typed text while editing, and the change, key and blur handlers around it. */
function useTimeText({ value, onValueChange, onBlur, onKeyDown, step }: HandlersInput) {
  const [draft, setDraft] = useState<string | null>(null);
  return {
    value: draft ?? value,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      setDraft(event.target.value);
      onValueChange(parseTimeText({ text: event.target.value }) ?? event.target.value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      const next = steppedValue({ event, value, step });
      if (next === null) return;
      event.preventDefault();
      setDraft(null);
      onValueChange(next);
    },
    onBlur: (event: FocusEvent<HTMLInputElement>) => {
      setDraft(null);
      onBlur?.(event);
    },
  };
}

/**
 * A time of day (`HH:mm`, 24 h) typed with the keyboard: `930`, `9:30` and `0930` all become
 * 09:30 on blur, ArrowUp/ArrowDown move it by `stepMinutes`. No native time picker.
 */
export function TimeInput({
  className,
  width,
  value,
  onValueChange,
  stepMinutes = 15,
  onBlur,
  onKeyDown,
  ...props
}: TimeInputProps) {
  const handlers = useTimeText({ value, onValueChange, onBlur, onKeyDown, step: stepMinutes });
  return (
    <div data-slot="time-input" className={cn(timeInputVariants({ width }), className)}>
      <ClockIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="hh:mm"
        maxLength={5}
        className="w-full min-w-0 bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground"
        {...props}
        {...handlers}
      />
    </div>
  );
}
