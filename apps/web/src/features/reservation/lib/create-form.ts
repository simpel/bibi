import { ReservationCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

export type NeedOption = { id: string; name: string };

export type ReservationFormValues = {
  roomItemId: string;
  /** The local day, `YYYY-MM-DD`. */
  date: string;
  partySize: string;
  /** The start picked from the availability, an ISO instant; "" = none yet. */
  startsAt: string;
  /** Tables chosen by hand; none = the smallest free fit. */
  tableIds: string[];
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  note: string;
  requirements: { vocabularyValueId: string; quantity: string }[];
};

export function reservationToInput({ values }: { values: ReservationFormValues }) {
  return {
    roomItemId: values.roomItemId,
    startsAt: values.startsAt,
    partySize: Number(values.partySize.trim()),
    ...(values.tableIds.length > 0 ? { tableIds: values.tableIds } : {}),
    bookerName: values.bookerName.trim(),
    bookerPhone: blankToNull({ value: values.bookerPhone }),
    bookerEmail: blankToNull({ value: values.bookerEmail }),
    note: blankToNull({ value: values.note }),
    requirements: values.requirements
      .filter((row) => row.vocabularyValueId !== "")
      .map((row) => ({
        vocabularyValueId: row.vocabularyValueId,
        quantity: Number(row.quantity.trim()),
      })),
  };
}

export const reservationFormSchema = formSchema({
  schema: ReservationCreateInputSchema,
  toInput: reservationToInput,
});

export type ReservationFormOutput = z.output<typeof reservationFormSchema>;

/** A reservation started from a table on the floor: its table, time and people. */
export type ReservationInitial = {
  tableId: string;
  /** The chosen time as an ISO instant. */
  startsAt: string;
  partySize: number;
  /** Walk-in guests: named for them and seated as soon as it is created. */
  walkInName: string;
};

export type ReservationDefaultsInput = {
  roomItemId: string;
  date: string;
  initial?: ReservationInitial | undefined;
};

export const reservationDefaults = ({
  roomItemId,
  date,
  initial,
}: ReservationDefaultsInput): ReservationFormValues => ({
  roomItemId,
  date,
  partySize: String(initial?.partySize ?? 2),
  startsAt: initial?.startsAt ?? "",
  tableIds: initial ? [initial.tableId] : [],
  bookerName: initial?.walkInName ?? "",
  bookerPhone: "",
  bookerEmail: "",
  note: "",
  requirements: [],
});
