import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { routedMethods } from "../payment/payment-preconditions";
import { requireLedger } from "../payment/require-ledger";
import type { PaymentSettingsDto } from "../payment-account/settings-schema";
import { loadPaymentSettings } from "../payment-account/settings-store";
import { checkLinesReadable } from "../quote/check-lines-readable";
import { deriveOrderLines } from "../quote/derive-lines";
import { quoteTotals } from "../quote/line-totals";
import type { DepositSuggestion } from "./schema";

export type DepositFromRuleInput = {
  totalMinor: number;
  settings: Pick<PaymentSettingsDto, "depositPercent" | "depositMinimumMinor">;
};

/**
 * The deposit rule (ADR 0090): below the minimum the whole total is paid up front, otherwise the
 * rule's percentage of it, rounded to whole minor units. No percentage = no rule.
 */
export function depositFromRule({
  totalMinor,
  settings,
}: DepositFromRuleInput): Pick<DepositSuggestion, "basis" | "amountMinor"> {
  const { depositPercent, depositMinimumMinor } = settings;
  if (depositMinimumMinor !== null && totalMinor < depositMinimumMinor) {
    return { basis: "FULL", amountMinor: totalMinor };
  }
  if (depositPercent === null) return { basis: "NONE", amountMinor: null };
  return { basis: "PERCENT", amountMinor: Math.round((totalMinor * depositPercent) / 100) };
}

export type SuggestDepositInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  orderId: string;
};

/**
 * The rule applied to the order's live priced lines incl. VAT (what an invoice would freeze).
 * The rule itself is `paymentAccount` data (ADR 0071): only the amount it gives leaves here.
 */
export async function suggestDeposit({
  context,
  orderId,
}: SuggestDepositInput): Promise<Result<DepositSuggestion>> {
  const readable = checkLinesReadable({ context, path: "orderId" });
  if (!readable.ok) return readable;
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) return notFound({ entity: "Order" });
  const derived = (await deriveOrderLines({ context, orderIds: [orderId] })).get(orderId) ?? [];
  const { totalInclVatMinor } = quoteTotals({ lines: derived.map((d) => d.line) });
  const [settings, card, ledger] = await Promise.all([
    loadPaymentSettings({ context }),
    routedMethods({ context }),
    requireLedger({ context }),
  ]);
  const paymentLinksAvailable = card.ok && card.value.length > 0;
  const rule = depositFromRule({ totalMinor: totalInclVatMinor, settings });
  const ledgerConnected = ledger.ok;
  return ok({ value: { totalInclVatMinor, ...rule, paymentLinksAvailable, ledgerConnected } });
}
