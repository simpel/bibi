"use client";

import {
  Button,
  ColorSwatch,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { ChevronDownIcon } from "lucide-react";
import type { ReactNode } from "react";

export type StatusTarget = { id: string; name: string; color: string };

export type StatusDropdownProps = {
  /** The current status (dot and name) shown on the button. */
  current: ReactNode;
  /** What a click does, as the button's label and the menu's heading. */
  label: string;
  targets: readonly StatusTarget[];
  onSelect: (input: { id: string }) => void;
  disabled?: boolean;
  /** `data-tour` of the button. */
  tour?: string;
};

/** The record's status as a dropdown button listing the statuses it may move to (orders, tasks). */
export function StatusDropdown({
  current,
  label,
  targets,
  onSelect,
  disabled,
  tour,
}: StatusDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" aria-label={label} disabled={disabled} data-tour={tour}>
          {current}
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        {targets.map((status) => (
          <DropdownMenuItem key={status.id} onSelect={() => onSelect({ id: status.id })}>
            <ColorSwatch color={status.color} />
            {status.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
