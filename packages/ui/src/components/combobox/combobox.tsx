"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { Command, CommandInput } from "../command/command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import type { ComboboxOption } from "./combobox-groups";
import { ComboboxList } from "./combobox-list";

export type ComboboxProps = {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  disabled?: boolean;
  className?: string;
};

export function Combobox(props: ComboboxProps) {
  const { options, value, onValueChange, placeholder, disabled, className } = props;
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          data-slot="combobox"
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDownIcon className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={props.searchPlaceholder} />
          <ComboboxList
            options={options}
            value={value}
            emptyText={props.emptyText}
            onSelect={(next) => {
              onValueChange(next);
              setOpen(false);
            }}
          />
        </Command>
      </PopoverContent>
    </Popover>
  );
}
