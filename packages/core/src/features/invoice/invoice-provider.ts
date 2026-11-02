import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { InvoiceProvider } from "../payment-account/settings-schema";
import { loadPaymentSettings } from "../payment-account/settings-store";

type Db = { context: Pick<OperationContext, "db"> };

/**
 * Where a sent invoice is raised (ADR 0090): the admin's choice in the payment settings, else
 * Fortnox when only Fortnox can take it, else Stripe when the Stripe account is active (the
 * customer then pays through a payment Bibi requests), else nowhere but Bibi (null).
 */
export async function resolveInvoiceProvider({
  context,
}: Db): Promise<Result<InvoiceProvider | null>> {
  const [settings, fortnox, account] = await Promise.all([
    loadPaymentSettings({ context }),
    context.db.integrationConnection.findFirst({
      where: { provider: "FORTNOX", status: "CONNECTED" },
      select: { id: true },
    }),
    context.db.paymentAccount.findFirst({ select: { status: true, disconnectedAt: true } }),
  ]);
  const stripe = account?.status === "ACTIVE" && !account.disconnectedAt;
  if (settings.invoiceProvider === "FORTNOX" && !fortnox) {
    return conflict({
      message:
        "Invoices go to Fortnox, but Fortnox is not connected. Connect it in Settings → Integrations.",
    });
  }
  if (settings.invoiceProvider) return ok({ value: settings.invoiceProvider });
  if (fortnox && !stripe) return ok({ value: "FORTNOX" });
  return ok({ value: stripe ? "STRIPE" : null });
}
