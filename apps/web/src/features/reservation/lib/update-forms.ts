import {
  PlainDateStringSchema,
  type ReservationDto,
  ReservationUpdateInputSchema,
} from "@bibi/core/schemas";
import { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

const WhenSchema = ReservationUpdateInputSchema.pick({ partySize: true, durationMinutes: true })
  .required()
  .extend({ date: PlainDateStringSchema, time: z.string().regex(/^\d{1,2}:\d{2}$/) });

export type WhenValues = {
  date: string;
  time: string;
  partySize: string;
  durationMinutes: string;
  tableIds: string[];
};

export const whenFormSchema = formSchema({
  schema: WhenSchema,
  toInput: ({ values }: { values: WhenValues }) => ({
    date: values.date,
    time: values.time,
    partySize: Number(values.partySize.trim()),
    durationMinutes: Number(values.durationMinutes.trim()),
  }),
});
export type WhenOutput = z.output<typeof whenFormSchema>;

export type WhenDefaultsInput = {
  reservation: Pick<ReservationDto, "partySize" | "tables">;
  date: string;
  time: string;
  durationMinutes: number;
};

export const whenDefaults = ({
  reservation,
  date,
  time,
  durationMinutes,
}: WhenDefaultsInput): WhenValues => ({
  date,
  time,
  partySize: String(reservation.partySize),
  durationMinutes: String(durationMinutes),
  tableIds: reservation.tables.map((table) => table.elementId),
});

export type BookerValues = {
  bookerName: string;
  bookerPhone: string;
  bookerEmail: string;
  note: string;
};

export const bookerFormSchema = formSchema({
  schema: ReservationUpdateInputSchema.pick({
    bookerName: true,
    bookerPhone: true,
    bookerEmail: true,
    note: true,
  }),
  toInput: ({ values }: { values: BookerValues }) => ({
    bookerName: values.bookerName.trim(),
    bookerPhone: blankToNull({ value: values.bookerPhone }),
    bookerEmail: blankToNull({ value: values.bookerEmail }),
    note: blankToNull({ value: values.note }),
  }),
});
export type BookerOutput = z.output<typeof bookerFormSchema>;

export const bookerDefaults = ({ reservation }: { reservation: ReservationDto }): BookerValues => ({
  bookerName: reservation.bookerName ?? "",
  bookerPhone: reservation.bookerPhone ?? "",
  bookerEmail: reservation.bookerEmail ?? "",
  note: reservation.note ?? "",
});

export type NeedsValues = { requirements: { vocabularyValueId: string; quantity: string }[] };

export const needsFormSchema = formSchema({
  schema: ReservationUpdateInputSchema.pick({ requirements: true }).required(),
  toInput: ({ values }: { values: NeedsValues }) => ({
    requirements: values.requirements
      .filter((row) => row.vocabularyValueId !== "")
      .map((row) => ({
        vocabularyValueId: row.vocabularyValueId,
        quantity: Number(row.quantity.trim()),
      })),
  }),
});
export type NeedsOutput = z.output<typeof needsFormSchema>;

export const needsDefaults = ({ reservation }: { reservation: ReservationDto }): NeedsValues => ({
  requirements: reservation.requirements.map((row) => ({
    vocabularyValueId: row.vocabularyValueId,
    quantity: String(row.quantity),
  })),
});
