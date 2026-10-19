import type { EntityTypeDto, LineDto } from "@okazi/core";
import { NONE } from "@/components/form/option-select-field";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the line form: inputs are strings, `NONE` = no item/setup. */
export type LineFormValues = {
  entityTypeId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  itemId: string;
  setupId: string;
  quantity: string;
  note: string;
  fields: Record<string, RawFieldValue>;
};

export type LineDefaultsInput = {
  type: EntityTypeDto | undefined;
  line?: LineDto | undefined;
  /** Where a new line starts: the ticket's start. */
  startsAt: Date;
};

const local = ({ date }: { date: Date }) => toLocalInputValue({ date });

export function lineFormDefaults({ type, line, startsAt }: LineDefaultsInput): LineFormValues {
  return {
    entityTypeId: type?.id ?? "",
    name: line?.name ?? "",
    startsAt: local({ date: line?.startsAt ?? startsAt }),
    endsAt: local({ date: line?.endsAt ?? new Date(startsAt.getTime() + 3_600_000) }),
    itemId: line?.itemId ?? NONE,
    setupId: line?.setupId ?? NONE,
    quantity: line?.quantity === null ? "" : String(line?.quantity ?? ""),
    note: line?.note ?? "",
    fields: rawFields({ type, stored: line?.fields ?? {} }),
  };
}
