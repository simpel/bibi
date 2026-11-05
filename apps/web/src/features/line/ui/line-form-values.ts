import type { EntityTypeDto, LineDto } from "@bibi/core";
import { type BufferFormValues, bufferFormDefaults } from "@/components/form/buffer-values";
import { NONE } from "@/components/form/option-select-field";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the line form: inputs are strings, `NONE` = no item/setup. */
export type LineFormValues = BufferFormValues & {
  entityTypeId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  itemId: string;
  setupId: string;
  quantity: string;
  /** Overrides; empty = inherit (price list or item, item or venue). */
  unitPrice: string;
  discountPercent: string;
  vatRatePercent: string;
  note: string;
  fields: Record<string, RawFieldValue>;
};

export type LineDefaultsInput = {
  type: EntityTypeDto | undefined;
  line?: LineDto | undefined;
  /** Where a new line starts: the order's start. */
  startsAt: Date;
  /** A new add-on's parent (ADR 0088): its period, or untimed like it. */
  parent?: LineDto | undefined;
  /** The zone the times show in: the line's item's venue zone (ADR 0064). */
  timeZone: string;
};

const text = ({ value }: { value: number | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

/** The period a form starts with: the line's, a new add-on's parent's, else an hour from `startsAt`. */
const periodOf = ({ line, parent, startsAt }: Omit<LineDefaultsInput, "type" | "timeZone">) => {
  const from = line ?? parent;
  if (from) return { start: from.startsAt, end: from.endsAt };
  return { start: startsAt, end: new Date(startsAt.getTime() + 3_600_000) };
};

export function lineFormDefaults({
  type,
  line,
  parent,
  startsAt,
  timeZone,
}: LineDefaultsInput): LineFormValues {
  const local = ({ date }: { date: Date | null }) =>
    date ? toLocalInputValue({ date, timeZone }) : "";
  const period = periodOf({ line, parent, startsAt });
  return {
    entityTypeId: type?.id ?? "",
    name: line?.name ?? "",
    // An untimed line (ADR 0052) keeps its empty times.
    startsAt: local({ date: period.start }),
    endsAt: local({ date: period.end }),
    itemId: line?.itemId ?? NONE,
    setupId: line?.setupId ?? NONE,
    ...bufferFormDefaults({ stored: line }),
    quantity: text({ value: line?.quantity }),
    unitPrice: text({ value: line?.unitPriceMinor == null ? null : line.unitPriceMinor / 100 }),
    discountPercent: text({ value: line?.discountPercent }),
    vatRatePercent: text({ value: line?.vatRatePercent }),
    note: line?.note ?? "",
    fields: rawFields({ type, stored: line?.fields ?? {} }),
  };
}
