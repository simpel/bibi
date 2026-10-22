import type { PriceListDto } from "@bibi/core";
import { PriceListCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { blankToNull, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the price list form: inputs are strings, dates `YYYY-MM-DD`. */
export type PriceListFormValues = {
  name: string;
  customerId: string;
  validFrom: string;
  validTo: string;
  discountPercent: string;
};

export type PriceListFormOutput = z.infer<typeof PriceListCreateInputSchema>;

/** Form strings → core's `priceList.create` input; empty values are sent as null (cleared). */
export function priceListFormToInput({ values }: { values: PriceListFormValues }) {
  return {
    name: values.name.trim(),
    customerId: values.customerId === NONE ? null : blankToNull({ value: values.customerId }),
    validFrom: blankToNull({ value: values.validFrom }),
    validTo: blankToNull({ value: values.validTo }),
    discountPercent: numberOrNull({ value: values.discountPercent }),
  };
}

export const priceListFormSchema = formSchema({
  schema: PriceListCreateInputSchema,
  toInput: priceListFormToInput,
});

const day = ({ date }: { date: Date | null | undefined }) =>
  date ? date.toISOString().slice(0, 10) : "";

export type PriceListDefaultsInput = { priceList?: PriceListDto | undefined };

export function priceListFormDefaults({ priceList }: PriceListDefaultsInput): PriceListFormValues {
  return {
    name: priceList?.name ?? "",
    customerId: priceList?.customerId ?? NONE,
    validFrom: day({ date: priceList?.validFrom }),
    validTo: day({ date: priceList?.validTo }),
    discountPercent: priceList?.discountPercent == null ? "" : String(priceList.discountPercent),
  };
}
