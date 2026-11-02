import type { EntityTypeDto } from "@bibi/core";
import { NONE } from "@/components/form/option-select-field";
import { rawFields, type WithRawFields } from "@/components/typed-fields/raw-fields";
import {
  type ChooseOptionsGroupValue,
  chooseOptionsDefaults,
} from "../../line/ui/choose-options-schema";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";

/** Raw values of the line dialog (spec "The line dialog"); the item is chosen outside the form. */
export type LineFormValues = WithRawFields & {
  entityTypeId: string;
  name: string;
  /** `HH:mm` on the line's day; both empty = untimed. */
  from: string;
  to: string;
  /** Empty: one per guest, follows the headcount. */
  quantity: string;
  setupId: string;
  unitPrice: string;
  discountPercent: string;
  note: string;
  groups: ChooseOptionsGroupValue[];
  needs: { valueId: string; count: string }[];
};

const time = ({ at, timeZone }: { at: string | null; timeZone: string }) =>
  at ? (toLocalInputValue({ date: new Date(at), timeZone }).split("T")[1] ?? "") : "";

const text = ({ value }: { value: number | null }) => (value === null ? "" : String(value));

export type LineDefaultsInput = {
  /** The line being edited; null adds one. */
  line: DraftLine | null;
  item: CatalogItem | null;
  type: EntityTypeDto | undefined;
  timeZone: string;
  /** Where a new timed line starts and ends: the ticket's period. */
  period: { startsAt: Date; endsAt: Date } | null;
};

/** A new bookable line runs its default length from the ticket's start, else the whole ticket. */
function newTimes({ item, period }: Pick<LineDefaultsInput, "item" | "period">) {
  if (!period || !item?.capabilities.includes("BOOKABLE")) return { startsAt: null, endsAt: null };
  const minutes = item.defaultDurationMinutes;
  const endsAt = minutes ? new Date(period.startsAt.getTime() + minutes * 60_000) : period.endsAt;
  return { startsAt: period.startsAt.toISOString(), endsAt: endsAt.toISOString() };
}

/** The dialog's values for an edited line, or a new one of `item` (or free text). */
export function lineFormDefaults({
  line,
  item,
  type,
  timeZone,
  period,
}: LineDefaultsInput): LineFormValues {
  const times = line ?? newTimes({ item, period });
  const groups = item
    ? chooseOptionsDefaults({
        item: { itemId: item.id, groups: item.groups },
        chosen: line?.options ?? [],
      }).groups
    : [];
  return {
    entityTypeId: type?.id ?? "",
    name: line?.name ?? item?.name ?? "",
    from: time({ at: times.startsAt, timeZone }),
    to: time({ at: times.endsAt, timeZone }),
    quantity: text({ value: line?.quantity ?? null }),
    setupId: line?.setupId ?? NONE,
    unitPrice: line?.unitPriceMinor == null ? "" : String(line.unitPriceMinor / 100),
    discountPercent: text({ value: line?.discountPercent ?? null }),
    note: line?.note ?? "",
    groups,
    needs: (line?.needs ?? []).map(({ vocabularyValueId, quantity }) => ({
      ...{ valueId: vocabularyValueId, count: String(quantity) },
    })),
    fields: rawFields({ type, stored: line?.fields ?? {} }),
  };
}
