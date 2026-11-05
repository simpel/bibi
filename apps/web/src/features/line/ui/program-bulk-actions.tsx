"use client";

import type { LineDto } from "@bibi/core";
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
import { useTranslations } from "next-intl";
import type { ProgramFormData } from "./program-form-data";
import type { ProgramAccess } from "./program-row-actions";

export type ProgramBulkActionsProps = {
  selected: LineDto[];
  data: ProgramFormData;
  access: ProgramAccess;
  onBatchChangeState: (input: { lineIds: string[]; stateId: string }) => void;
};

/**
 * Bulk actions bar displayed above the table when lines are selected.
 * Allows batch-editing the state of all selected lines simultaneously.
 */
export function ProgramBulkActions({
  selected,
  data,
  access,
  onBatchChangeState,
}: ProgramBulkActionsProps) {
  const t = useTranslations("line");

  if (!access.canChangeState || selected.length === 0) return null;

  // Find candidate states matching selected lines' entity types
  const selectedTypes = new Set(selected.map((l) => l.entityTypeId).filter(Boolean));
  const candidateStates =
    selectedTypes.size > 0
      ? data.states.filter((s) => selectedTypes.has(s.entityTypeId))
      : data.states;

  // Deduplicate by name and color
  const seen = new Set<string>();
  const states = candidateStates.filter((s) => {
    const key = `${s.name}:${s.color}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <span>{t("changeState")}</span>
          <ChevronDownIcon className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t("changeState")}</DropdownMenuLabel>
        {states.map((state) => (
          <DropdownMenuItem
            key={state.id}
            onSelect={() =>
              onBatchChangeState({
                lineIds: selected.map((line) => line.id),
                stateId: state.id,
              })
            }
          >
            <ColorSwatch color={state.color} />
            <span>{state.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
