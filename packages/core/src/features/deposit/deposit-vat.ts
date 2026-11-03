import { scaleParts } from "../../accounting/sie4/sale";
import type { OperationContext } from "../../operations/types";
import { deriveTicketLines } from "../quote/derive-lines";
import type { VatRow } from "../quote/order-line-schema";

type PricedLine = { inTotal: boolean; vatRows: readonly VatRow[] };

/** VAT per rate summed over the lines that count, ascending by rate. */
function ratesOf({ lines }: { lines: readonly PricedLine[] }) {
  const byRate = new Map<number, { exclVatMinor: number; vatMinor: number }>();
  for (const line of lines) {
    if (!line.inTotal) continue;
    for (const row of line.vatRows) {
      const sum = byRate.get(row.vatRatePercent) ?? { exclVatMinor: 0, vatMinor: 0 };
      sum.exclVatMinor += row.totalExclVatMinor;
      sum.vatMinor += row.vatMinor;
      byRate.set(row.vatRatePercent, sum);
    }
  }
  return [...byRate]
    .sort(([a], [b]) => a - b)
    .map(([vatRatePercent, sum]) => ({ vatRatePercent, ...sum }));
}

export type SplitDepositVatInput = { lines: readonly PricedLine[]; amountMinor: number };

/**
 * A deposit's VAT split (ADR 0093): the lines' VAT mix scaled to its amount incl. VAT, the rows
 * summing to it. `[]` when nothing is priced: the supply is not known, so no VAT is due on it.
 */
export function splitDepositVat({ lines, amountMinor }: SplitDepositVatInput): VatRow[] {
  const rates = ratesOf({ lines });
  if (rates.reduce((sum, rate) => sum + rate.exclVatMinor + rate.vatMinor, 0) <= 0) return [];
  return scaleParts({ parts: rates, amountMinor })
    .filter((part) => part.exclVatMinor !== 0 || part.vatMinor !== 0)
    .map((part) => ({
      vatRatePercent: part.vatRatePercent,
      totalExclVatMinor: part.exclVatMinor,
      vatMinor: part.vatMinor,
    }));
}

export type DepositVatRowsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  ticketId: string;
  amountMinor: number;
};

/** The split of a new deposit from the ticket's live priced lines, the basis of the deposit rule. */
export async function depositVatRows({ context, ticketId, amountMinor }: DepositVatRowsInput) {
  const derived = (await deriveTicketLines({ context, ticketIds: [ticketId] })).get(ticketId) ?? [];
  return splitDepositVat({ lines: derived.map((d) => d.line), amountMinor });
}
