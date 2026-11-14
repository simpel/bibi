import type { IntakeData } from "../load-intake-data";
import type { DraftLine, NewKey } from "./draft-line";
import type { IntakePeriod } from "./intake-period";
import { quickLine } from "./quick-line";

export type SlotLinesInput = {
  data: Pick<IntakeData, "slot" | "catalog">;
  period: IntakePeriod;
  newKey: NewKey;
};

/**
 * The lines a custom booking starts with when the intake came from a calendar slot: the slot's
 * resource over the order's period, on the first line type. None without a slot, or when the
 * resource is not in the catalog.
 */
export function slotLines({ data, period, newKey }: SlotLinesInput): DraftLine[] {
  const { slot, catalog } = data;
  const item = slot ? catalog.items.find(({ id }) => id === slot.itemId) : undefined;
  const lineTypeId = catalog.lineTypes[0]?.id;
  if (!item || !lineTypeId) return [];
  const line = quickLine({ item, lineTypeId, period, key: newKey() });
  if (!line.startsAt) return [line];
  return [
    { ...line, startsAt: period.startsAt.toISOString(), endsAt: period.endsAt.toISOString() },
  ];
}
