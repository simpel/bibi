"use client";

import { GlobeIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { normalizeWebsiteUrl } from "./website-format";

export type WebsiteInputProps = Omit<
  ComponentProps<"input">,
  "value" | "onChange" | "type"
> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * An accessible website input that shows a globe icon and normalizes URLs
 * on blur (e.g. `example.se` -> `https://example.se`).
 */
export function WebsiteInput({
  className,
  value,
  onValueChange,
  placeholder = "https://example.se",
  autoComplete = "url",
  disabled,
  onBlur,
  ...props
}: WebsiteInputProps) {
  return (
    <div
      data-slot="website-input"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        "has-[input[aria-invalid=true]]:border-destructive",
        className,
      )}
    >
      <GlobeIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="url"
        inputMode="url"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => {
          onValueChange(event.target.value);
        }}
        onBlur={(event) => {
          const raw = event.target.value.trim();
          if (raw) {
            const normalized = normalizeWebsiteUrl({ value: raw });
            onValueChange(normalized);
          }
          onBlur?.(event);
        }}
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
}
