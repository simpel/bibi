"use client";

import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { COUNTRIES, type Country } from "../../lib/countries";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../command/command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";

export type SelectCountryInput = { country: Country };

export type PhoneCountryPickerProps = {
  country: Country;
  onSelectCountry: (input: SelectCountryInput) => void;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyText?: string;
};

/**
 * Country dial code picker for PhoneInput with emoji flag trigger and searchable dropdown.
 */
export function PhoneCountryPicker({
  country,
  onSelectCountry,
  disabled,
  searchPlaceholder = "Search country or dial code…",
  emptyText = "No country found.",
}: PhoneCountryPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label={`Select country code (current: ${country.name} ${country.dialCode})`}
          className={cn(
            "group flex h-7 items-center gap-1 -ml-1 rounded px-1.5 text-xs text-muted-foreground transition-colors",
            "hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="text-base leading-none select-none" aria-hidden="true">
            {country.flag}
          </span>
          <ChevronDownIcon
            className="size-3 opacity-60 transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-60 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code} ${c.dialCode}`}
                  keywords={[c.code, c.name, c.dialCode]}
                  onSelect={() => {
                    onSelectCountry({ country: c });
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="text-base leading-none" aria-hidden="true">
                    {c.flag}
                  </span>
                  <span className="flex-1 truncate text-sm">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {c.dialCode}
                  </span>
                  <CheckIcon
                    className={cn(
                      "size-4 shrink-0",
                      c.code === country.code ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
