import type { QuoteDto } from "@okazi/core";
import { QuoteCreateInputSchema, QuoteUpdateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { blankToNull, numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/**
 * One order line row. Field names match core's input paths so server issues land on them;
 * `unitPriceMinor` is typed in kronor (blank = the item's price) and converted on submit.
 */
export type QuoteLineRowValues = {
  lineId: string;
  itemId: string;
  quantity: string;
  unitPriceMinor: string;
  discountPercent: string;
};

/** Raw values of the quote form: inputs are strings, the validity a `YYYY-MM-DD` day. */
export type QuoteFormValues = { validUntil: string; terms: string; lines: QuoteLineRowValues[] };

export type QuoteFormOutput =
  | z.infer<typeof QuoteCreateInputSchema>
  | z.infer<typeof QuoteUpdateInputSchema>;

/** The quote answers `ticketId` (create) or is the draft `id` (update). */
export type QuoteFormTarget = { ticketId: string } | { id: string };

const toMinor = ({ value }: { value: string }) => {
  const kr = numberOrUndefined({ value });
  return kr === undefined ? undefined : Math.round(kr * 100);
};

/** The end of the chosen day in local time: a quote is valid all through its last day. */
const endOfDay = ({ value }: { value: string }) => {
  const day = blankToNull({ value });
  return day === null ? null : new Date(`${day}T23:59:59`);
};

export function quoteFormToInput({ values }: { values: QuoteFormValues }) {
  return {
    validUntil: endOfDay({ value: values.validUntil }),
    terms: blankToNull({ value: values.terms }),
    lines: values.lines.map((row) => ({
      ...(row.lineId ? { lineId: row.lineId } : {}),
      itemId: row.itemId,
      quantity: Number(row.quantity.trim() || Number.NaN),
      unitPriceMinor: toMinor({ value: row.unitPriceMinor }),
      discountPercent: numberOrUndefined({ value: row.discountPercent }),
    })),
  };
}

export const quoteFormSchema = ({ target }: { target: QuoteFormTarget }) =>
  "id" in target
    ? formSchema({
        schema: QuoteUpdateInputSchema,
        toInput: ({ values }: { values: QuoteFormValues }) => ({
          ...quoteFormToInput({ values }),
          id: target.id,
        }),
      })
    : formSchema({
        schema: QuoteCreateInputSchema,
        toInput: ({ values }: { values: QuoteFormValues }) => ({
          ...quoteFormToInput({ values }),
          ticketId: target.ticketId,
        }),
      });

export const EMPTY_LINE: QuoteLineRowValues = {
  lineId: "",
  itemId: "",
  quantity: "1",
  unitPriceMinor: "",
  discountPercent: "",
};

const pad = ({ n }: { n: number }) => String(n).padStart(2, "0");

const localDay = ({ date }: { date: Date | null }) =>
  date
    ? `${date.getFullYear()}-${pad({ n: date.getMonth() + 1 })}-${pad({ n: date.getDate() })}`
    : "";

export function quoteFormDefaults({ quote }: { quote?: QuoteDto | undefined }): QuoteFormValues {
  return {
    validUntil: localDay({ date: quote?.validUntil ?? null }),
    terms: quote?.terms ?? "",
    lines: (quote?.lines ?? []).map((line) => ({
      lineId: line.id,
      itemId: line.itemId,
      quantity: String(line.quantity),
      unitPriceMinor: String(line.unitPriceMinor / 100),
      discountPercent: line.discountPercent ? String(line.discountPercent) : "",
    })),
  };
}
