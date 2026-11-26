import { PlainDateStringSchema, TableBlockCreateInputSchema } from "@bibi/core/schemas";
import { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

export type BlockFormValues = {
  elementIds: string[];
  kind: "BLOCK" | "ONLINE_ONLY";
  startDay: string;
  startTime: string;
  endDay: string;
  endTime: string;
  note: string;
};

const Time = z.string().regex(/^\d{1,2}:\d{2}$/);

/** Core's block fields, with the period as local days and times (instants are made on the server). */
const schema = z.object({
  elementIds: TableBlockCreateInputSchema.shape.elementIds,
  kind: TableBlockCreateInputSchema.shape.kind,
  note: TableBlockCreateInputSchema.shape.note,
  startDay: PlainDateStringSchema,
  endDay: PlainDateStringSchema,
  startTime: Time,
  endTime: Time,
});

export type BlockActionInput = z.output<typeof schema> & { roomItemId: string };

export function blockToInput({ values }: { values: BlockFormValues }) {
  return {
    elementIds: values.elementIds,
    kind: values.kind,
    startDay: values.startDay,
    endDay: values.endDay,
    startTime: values.startTime,
    endTime: values.endTime,
    note: blankToNull({ value: values.note }),
  };
}

export const blockFormSchema = formSchema({ schema, toInput: blockToInput });
export type BlockFormOutput = z.output<typeof blockFormSchema>;

export const blockDefaults = ({ day }: { day: string }): BlockFormValues => ({
  elementIds: [],
  kind: "BLOCK",
  startDay: day,
  startTime: "17:00",
  endDay: day,
  endTime: "23:00",
  note: "",
});
