import { InquiryAssignInputSchema, InquiryQualifyInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw value of the owner forms: a user id, or `NONE` for no one. */
export type OwnerFormValues = { salesOwnerId: string };

export type QualifyFormOutput = z.infer<typeof InquiryQualifyInputSchema>;
export type AssignOwnerFormOutput = z.infer<typeof InquiryAssignInputSchema>;

const owner = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

export const ownerFormDefaults = ({ salesOwnerId }: { salesOwnerId: string | null }) => ({
  salesOwnerId: salesOwnerId ?? NONE,
});

/** Core's `inquiry.qualify` schema; no pick keeps the inquiry's current owner. */
export const qualifyFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: InquiryQualifyInputSchema,
    toInput: ({ values }: { values: OwnerFormValues }) => ({
      id,
      salesOwnerId: owner({ value: values.salesOwnerId }) ?? undefined,
    }),
  });

/** Core's `inquiry.assign` schema; `NONE` removes the owner. */
export const assignOwnerFormSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: InquiryAssignInputSchema,
    toInput: ({ values }: { values: OwnerFormValues }) => ({
      id,
      salesOwnerId: owner({ value: values.salesOwnerId }),
    }),
  });
