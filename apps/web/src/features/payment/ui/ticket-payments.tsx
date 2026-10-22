import { getTicketBalance, listDeposits, listInvoices, listPayments } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Link } from "@bibi/i18n/navigation";
import { Button } from "@bibi/ui";
import { HandCoinsIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { depositNewRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { BalanceSummary } from "./balance-summary";
import { CreateInvoiceButton } from "./create-invoice-button";
import { PaymentList } from "./payment-list";
import { ReceivableList } from "./receivable-list";

export type TicketPaymentsProps = { locale: Locale; ticketId: string; canRequest: boolean };

const LIMIT = 50;

/** Every money read of the ticket at once: balance, receivables and payments (ADR 0057). */
async function loadMoney({ ticketId }: { ticketId: string }) {
  const page = { ticketId, limit: LIMIT };
  const [balance, deposits, invoices, payments] = await Promise.all([
    runOperation({ operation: getTicketBalance, input: { ticketId } }),
    runOperation({ operation: listDeposits, input: page }),
    runOperation({ operation: listInvoices, input: page }),
    runOperation({ operation: listPayments, input: page }),
  ]);
  if (!balance.ok) return balance;
  if (!deposits.ok) return deposits;
  if (!invoices.ok) return invoices;
  if (!payments.ok) return payments;
  const value = {
    balance: balance.value,
    deposits: deposits.value.items,
    invoices: invoices.value.items,
  };
  return { ok: true as const, value: { ...value, payments: payments.value.items } };
}

/** What the ticket's customer owes and has paid, what it pays for, and new requests. */
export async function TicketPayments({ locale, ticketId, canRequest }: TicketPaymentsProps) {
  const t = await getTranslations("payment");
  const deposit = await getTranslations("deposit");
  const result = await loadMoney({ ticketId });
  if (!result.ok && result.error.code === "FORBIDDEN") return null;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { balance, deposits, invoices, payments } = result.value;
  return (
    <section data-slot="ticket-payments" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("balance.title")}</h2>
        {canRequest ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href={depositNewRoute({ ticketId })}>
                <HandCoinsIcon />
                {deposit("create")}
              </Link>
            </Button>
            <CreateInvoiceButton ticketId={ticketId} />
          </div>
        ) : null}
      </div>
      <BalanceSummary balance={balance} />
      <h3 className="font-medium">{t("receivables")}</h3>
      <ReceivableList {...{ balance, deposits, invoices }} canWrite={canRequest} />
      <h3 className="font-medium">{t("plural")}</h3>
      <PaymentList payments={payments} />
    </section>
  );
}
