import type { QuoteDto } from "@bibi/core";
import { QuoteCreateInputSchema, QuoteUpdateInputSchema, toZonedParts } from "@bibi/core/schemas";
import type { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/**
 * Raw values of the quote form: the validity a `YYYY-MM-DD` day. The lines are the ticket's own
 * and are edited there (ADR 0052).
 */
export type QuoteFormValues = { validUntil: string; terms: string };

export type QuoteFormOutput =
  | z.infer<typeof QuoteCreateInputSchema>
  | z.infer<typeof QuoteUpdateInputSchema>;

/** The quote answers `ticketId` (create) or is the draft `id` (update). */
export type QuoteFormTarget = { ticketId: string } | { id: string };

/** The end of the chosen day in local time: a quote is valid all through its last day. */
const endOfDay = ({ value }: { value: string }) => {
  const day = blankToNull({ value });
  return day === null ? null : new Date(`${day}T23:59:59`);
};

export function quoteFormToInput({ values }: { values: QuoteFormValues }) {
  return {
    validUntil: endOfDay({ value: values.validUntil }),
    terms: blankToNull({ value: values.terms }),
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

const pad = ({ n }: { n: number }) => String(n).padStart(2, "0");

/** The `YYYY-MM-DD` day `date` has in the host's local zone, the zone `endOfDay` reads it in. */
const localDay = ({ date }: { date: Date | null }) => {
  if (!date) return "";
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { date: day } = toZonedParts({ instant: date, timeZone });
  return `${day.year}-${pad({ n: day.month })}-${pad({ n: day.day })}`;
};

export function quoteFormDefaults({ quote }: { quote?: QuoteDto | undefined }): QuoteFormValues {
  return {
    validUntil: localDay({ date: quote?.validUntil ?? null }),
    terms: quote?.terms ?? "",
  };
}
