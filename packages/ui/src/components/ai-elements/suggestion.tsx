"use client";

import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";

export type SuggestionsProps = ComponentProps<"div">;

/** AI Elements `Suggestions`: wrapping row of one-click prompts. */
export function Suggestions({ className, ...props }: SuggestionsProps) {
  return (
    <div
      data-slot="suggestions"
      className={cn("flex flex-wrap justify-center gap-2", className)}
      {...props}
    />
  );
}

export type SuggestionProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  suggestion: string;
  onClick?: (input: { suggestion: string }) => void;
};

export function Suggestion({
  suggestion,
  onClick,
  className,
  children,
  ...props
}: SuggestionProps) {
  return (
    <Button
      data-slot="suggestion"
      type="button"
      variant="outline"
      size="sm"
      className={cn("h-auto whitespace-normal rounded-full px-4 py-1.5 font-normal", className)}
      onClick={() => onClick?.({ suggestion })}
      {...props}
    >
      {children ?? suggestion}
    </Button>
  );
}
