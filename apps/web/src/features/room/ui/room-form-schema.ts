import { RoomCreateInputSchema } from "@okazi/core/schemas";
import type { RoomDto } from "@okazi/core";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the room form: text inputs are strings ("" = empty), daylight is boolean. */
export type RoomFormValues = {
  venueId: string;
  name: string;
  description: string;
  floor: string;
  areaSqm: string;
  ceilingHeightM: string;
  maxCapacity: string;
  hasDaylight: boolean;
};

export type RoomFormInput = { values: RoomFormValues };

/** Form strings → the shape core's `room.create` input schema validates. */
export function roomFormToInput({ values }: RoomFormInput) {
  return {
    venueId: values.venueId,
    name: values.name.trim(),
    description: blankToNull({ value: values.description }),
    floor: blankToNull({ value: values.floor }),
    areaSqm: numberOrNull({ value: values.areaSqm }),
    ceilingHeightM: numberOrNull({ value: values.ceilingHeightM }),
    maxCapacity: numberOrNull({ value: values.maxCapacity }),
    hasDaylight: values.hasDaylight,
  };
}

export const roomFormSchema = formSchema({
  schema: RoomCreateInputSchema,
  toInput: roomFormToInput,
});

export type RoomDefaultsInput = { venueId: string; room?: RoomDto | undefined };

const text = ({ value }: { value: number | string | null | undefined }) =>
  value === null || value === undefined ? "" : String(value);

export function roomFormDefaults({ venueId, room }: RoomDefaultsInput): RoomFormValues {
  return {
    venueId,
    name: room?.name ?? "",
    description: room?.description ?? "",
    floor: room?.floor ?? "",
    areaSqm: text({ value: room?.areaSqm }),
    ceilingHeightM: text({ value: room?.ceilingHeightM }),
    maxCapacity: text({ value: room?.maxCapacity }),
    hasDaylight: room?.hasDaylight ?? false,
  };
}
