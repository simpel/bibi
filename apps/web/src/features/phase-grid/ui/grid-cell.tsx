"use client";

import type { ItemStateDto } from "@okazi/core/schemas";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { KEEP, useSetCell } from "./use-set-cell";

export type GridCellProps = {
  phase: { id: string; name: string };
  type: { id: string; name: string };
  /** The type's active states. */
  states: readonly ItemStateDto[];
  /** The state the cell sets, or null for "keep". */
  stateId: string | null;
  canAdmin: boolean;
};

/** One cell: a dropdown of the type's states or "keep", with what it does in plain words. */
export function GridCell({ phase, type, states, stateId, canAdmin }: GridCellProps) {
  const t = useTranslations("phaseGrid");
  const { pending, change } = useSetCell({ phaseId: phase.id, entityTypeId: type.id });
  const current = states.find((state) => state.id === stateId);
  const words = current
    ? t("cellSets", { type: type.name, state: current.name, phase: phase.name })
    : t("cellKeeps", { type: type.name });
  return (
    <div className="grid gap-1">
      <Select
        value={current?.id ?? KEEP}
        onValueChange={(value) => change({ value })}
        disabled={!canAdmin || pending}
      >
        <SelectTrigger aria-label={t("cellLabel", { phase: phase.name, type: type.name })}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={KEEP}>{t("keep")}</SelectItem>
          {states.map((state) => (
            <SelectItem key={state.id} value={state.id}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{words}</p>
    </div>
  );
}
