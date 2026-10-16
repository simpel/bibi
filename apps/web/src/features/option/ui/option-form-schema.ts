import { OptionCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the option form; the item is fixed by the page. */
export type OptionFormValues = {
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  note: string;
};

export type OptionFormOutput = z.infer<typeof OptionCreateInputSchema>;

export const OPTION_FORM_DEFAULTS: OptionFormValues = {
  startsAt: "",
  endsAt: "",
  expiresAt: "",
  note: "",
};

export type OptionSchemaInput = { itemId: string };

/** Core's create schema is the single source of validation rules for the form. */
export const optionFormSchema = ({ itemId }: OptionSchemaInput) =>
  formSchema({
    schema: OptionCreateInputSchema,
    toInput: ({ values }: { values: OptionFormValues }) => ({
      itemId,
      startsAt: fromLocalInputValue({ value: values.startsAt }),
      endsAt: fromLocalInputValue({ value: values.endsAt }),
      expiresAt: fromLocalInputValue({ value: values.expiresAt }),
      note: blankToNull({ value: values.note }),
    }),
  });
