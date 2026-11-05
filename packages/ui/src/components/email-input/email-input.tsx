"use client";

import { MailIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { cleanEmail, isAllowedEmailKey } from "./email-format";

export type EmailInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: string;
  onValueChange: (value: string) => void;
};

/**
 * An accessible email input that trims whitespace, prevents spaces,
 * and displays an email icon.
 */
export function EmailInput({
  className,
  value,
  onValueChange,
  placeholder = "name@example.com",
  autoComplete = "email",
  disabled,
  onKeyDown,
  onBlur,
  onPaste,
  ...props
}: EmailInputProps) {
  return (
    <div
      data-slot="email-input"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        "has-[input[aria-invalid=true]]:border-destructive",
        className,
      )}
    >
      <MailIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <input
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => {
          onValueChange(cleanEmail({ value: event.target.value }));
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;

          const allowed = isAllowedEmailKey({
            key: event.key,
            ctrlOrMeta: event.ctrlKey || event.metaKey,
          });
          if (!allowed) {
            event.preventDefault();
          }
        }}
        onPaste={(event) => {
          onPaste?.(event);
          if (event.defaultPrevented) return;

          event.preventDefault();
          const pasted = event.clipboardData.getData("text");
          const el = event.currentTarget;
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;
          const before = (value ?? "").slice(0, start);
          const after = (value ?? "").slice(end);
          const next = cleanEmail({ value: before + pasted + after });
          onValueChange(next);
        }}
        onBlur={(event) => {
          onValueChange(cleanEmail({ value: event.target.value }));
          onBlur?.(event);
        }}
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
}
