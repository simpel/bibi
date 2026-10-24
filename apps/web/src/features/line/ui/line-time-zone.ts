import type { LineDto } from "@bibi/core";
import type { ProgramFormData } from "./program-form-data";

export type LineTimeZoneInput = {
  data: Pick<ProgramFormData, "items" | "bundles" | "timeZone">;
  itemId: string | null | undefined;
  /** The line being edited: its own zone (derived by core) while it keeps its item. */
  line?: Pick<LineDto, "itemId" | "timeZone"> | undefined;
};

/**
 * The zone a line's times show and are entered in (ADR 0064 decision 4): its item's zone as core
 * derives it, else the organization's (no item). The item picker offers only listed items, so a
 * chosen item is either the edited line's own (also when items are hidden from the caller) or in
 * the list.
 */
export function lineTimeZone({ data, itemId, line }: LineTimeZoneInput): string {
  if (!itemId) return data.timeZone;
  if (line && line.itemId === itemId) return line.timeZone;
  const option = [...data.items, ...data.bundles].find((candidate) => candidate.id === itemId);
  return option?.timeZone ?? data.timeZone;
}
