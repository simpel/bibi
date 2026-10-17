import { InquiryQualifyInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw value of the qualify form: a user id, or `NONE` to keep the current assignee. */
export type QualifyFormValues = { assigneeId: string };

export type QualifyFormOutput = z.infer<typeof InquiryQualifyInputSchema>;

export const qualifyFormDefaults = (): QualifyFormValues => ({ assigneeId: NONE });

/** Core's `inquiry.qualify` schema; no pick keeps the inquiry's current main assignee. */
export const qualifyFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: InquiryQualifyInputSchema,
    toInput: ({ values }: { values: QualifyFormValues }) => ({
      id,
      assigneeId:
        values.assigneeId === NONE || values.assigneeId === "" ? undefined : values.assigneeId,
    }),
  });
