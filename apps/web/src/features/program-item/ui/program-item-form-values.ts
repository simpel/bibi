import type { EntityTypeDto, ProgramItemDto } from "@okazi/core";
import { type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { NONE } from "../../booking/ui/option-select-field";
import { toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the program item form: inputs are strings, `NONE` = no item/setup/person. */
export type ProgramItemFormValues = {
  entityTypeId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  itemId: string;
  setupId: string;
  quantity: string;
  responsibleId: string;
  note: string;
  fields: Record<string, RawFieldValue>;
};

export type ProgramItemDefaultsInput = {
  type: EntityTypeDto | undefined;
  programItem?: ProgramItemDto | undefined;
  /** Where a new program item starts: the booking's start. */
  startsAt: Date;
};

const local = ({ date }: { date: Date }) => toLocalInputValue({ date });

export function programItemFormDefaults({
  type,
  programItem,
  startsAt,
}: ProgramItemDefaultsInput): ProgramItemFormValues {
  return {
    entityTypeId: type?.id ?? "",
    name: programItem?.name ?? "",
    startsAt: local({ date: programItem?.startsAt ?? startsAt }),
    endsAt: local({ date: programItem?.endsAt ?? new Date(startsAt.getTime() + 3_600_000) }),
    itemId: programItem?.itemId ?? NONE,
    setupId: programItem?.setupId ?? NONE,
    quantity: programItem?.quantity === null ? "" : String(programItem?.quantity ?? ""),
    responsibleId: programItem?.responsibleId ?? NONE,
    note: programItem?.note ?? "",
    fields: rawFields({ type, stored: programItem?.fields ?? {} }),
  };
}
