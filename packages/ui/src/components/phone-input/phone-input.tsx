"use client";

import { type ComponentProps, useRef, useState } from "react";
import { cn } from "../../lib/cn";
import {
  applyCountryDialCode,
  type Country,
  DEFAULT_COUNTRY,
  detectCountryFromPhone,
} from "../../lib/countries";
import { PhoneCountryPicker } from "./phone-country-picker";
import {
  calculateCaretPosition,
  countRawCharsBefore,
  formatPhoneNumber,
  handlePhoneBackspace,
  isAllowedPhoneKey,
} from "./phone-format";

export type PhoneInputProps = Omit<ComponentProps<"input">, "value" | "onChange" | "type"> & {
  /** Formatted phone number, e.g. `+46 70 123 45 67` or `070-123 45 67`. */
  value: string;
  onValueChange: (value: string) => void;
  searchPlaceholder?: string;
  emptyText?: string;
};

/**
 * An accessible phone number input that auto-formats as the user types,
 * provides an interactive country code picker with emoji flags,
 * only allows valid phone characters (digits and leading '+'), and
 * preserves caret position accurately across edits.
 */
export function PhoneInput({
  className,
  value,
  onValueChange,
  placeholder = "+46 70 123 45 67",
  autoComplete = "tel",
  disabled,
  searchPlaceholder,
  emptyText,
  onKeyDown,
  onPaste,
  ...props
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);

  const formattedValue = formatPhoneNumber({ value: value ?? "" });
  const detectedCountry = detectCountryFromPhone({ phone: formattedValue });
  const activeCountry = formattedValue ? detectedCountry : selectedCountry;

  const setCaret = ({ position }: { position: number }) => {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el && document.activeElement === el) {
        el.setSelectionRange(position, position);
      }
    });
  };

  return (
    <div
      data-slot="phone-input"
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 shadow-xs transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
        "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50",
        "has-[input[aria-invalid=true]]:border-destructive",
        className,
      )}
    >
      <PhoneCountryPicker
        country={activeCountry}
        onSelectCountry={({ country }) => {
          setSelectedCountry(country);
          const nextValue = applyCountryDialCode({ phone: formattedValue, country });
          onValueChange(nextValue);
          setCaret({ position: nextValue.length });
          inputRef.current?.focus();
        }}
        disabled={disabled}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
      />
      <div className="h-4 w-px bg-border shrink-0" aria-hidden="true" />
      <input
        ref={inputRef}
        type="tel"
        inputMode="tel"
        autoComplete={autoComplete}
        disabled={disabled}
        placeholder={placeholder}
        value={formattedValue}
        onChange={(event) => {
          const rawInput = event.target.value;
          const caret = event.target.selectionStart ?? rawInput.length;
          const rawCount = countRawCharsBefore({ text: rawInput, index: caret });

          const nextFormatted = formatPhoneNumber({ value: rawInput });
          const nextCaret = calculateCaretPosition({
            rawCountBeforeCaret: rawCount,
            nextFormatted,
          });

          onValueChange(nextFormatted);
          setCaret({ position: nextCaret });
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;

          const el = event.currentTarget;
          const start = el.selectionStart ?? 0;
          const end = el.selectionEnd ?? 0;

          if (event.key === "Backspace") {
            const backspaceResult = handlePhoneBackspace({
              value: formattedValue,
              selectionStart: start,
              selectionEnd: end,
            });
            if (backspaceResult !== null) {
              event.preventDefault();
              onValueChange(backspaceResult.nextValue);
              setCaret({ position: backspaceResult.nextCaret });
              return;
            }
          }

          const allowed = isAllowedPhoneKey({
            key: event.key,
            value: formattedValue,
            selectionStart: start,
            selectionEnd: end,
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

          const before = formattedValue.slice(0, start);
          const after = formattedValue.slice(end);
          const combined = before + pasted + after;

          const nextFormatted = formatPhoneNumber({ value: combined });
          const rawCount = countRawCharsBefore({
            text: before + pasted,
            index: (before + pasted).length,
          });
          const nextCaret = calculateCaretPosition({
            rawCountBeforeCaret: rawCount,
            nextFormatted,
          });

          onValueChange(nextFormatted);
          setCaret({ position: nextCaret });
        }}
        className="w-full min-w-0 bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground"
        {...props}
      />
    </div>
  );
}
