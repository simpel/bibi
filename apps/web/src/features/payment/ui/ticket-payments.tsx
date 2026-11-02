import {
  type DepositSuggestion,
  getTicketBalance,
  listDeposits,
  listInvoices,
  listPayments,
  suggestDepositAmount,
} from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { HandCoinsIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { RequestDeposit } from "@/features/deposit/ui/request-deposit";
import { Link } from "@/lib/navigation";
import { depositNewRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { BalanceSummary } from "./balance-summary";
import { CreateInvoiceButton } from "./create-invoice-button";
import { PaymentLinksProvider } from "./payment-links-context";
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

type PaymentActionsProps = { ticketId: string; suggestion: DepositSuggestion | null };

/** New requests on the ticket: a fixed deposit, a deposit with a payment link, an invoice. */
async function PaymentActions({ ticketId, suggestion }: PaymentActionsProps) {
  const deposit = await getTranslations("deposit");
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild>
        <Link href={depositNewRoute({ ticketId })}>
          <HandCoinsIcon />
          {deposit("create")}
        </Link>
      </Button>
      {suggestion ? <RequestDeposit ticketId={ticketId} suggestion={suggestion} /> : null}
      <CreateInvoiceButton ticketId={ticketId} />
    </div>
  );
}

/** What the ticket's customer owes and has paid, what it pays for, and new requests. */
export async function TicketPayments({ locale, ticketId, canRequest }: TicketPaymentsProps) {
  const t = await getTranslations("payment");
  const [dates, numbers] = await Promise.all([getDateTimeFormat(), getNumberFormat()]);
  const result = await loadMoney({ ticketId });
  if (!result.ok && result.error.code === "FORBIDDEN") return null;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const { balance, deposits, invoices, payments } = result.value;
  // Payment links need the organization's own active Stripe account (ADR 0090).
  const suggestion = await runOperation({ operation: suggestDepositAmount, input: { ticketId } });
  const available = !suggestion.ok || suggestion.value.paymentLinksAvailable;
  return (
    <PaymentLinksProvider available={available}>
      <section data-slot="ticket-payments" className="grid grid-cols-1 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">{t("balance.title")}</h2>
          {canRequest ? (
            <PaymentActions
              ticketId={ticketId}
              suggestion={suggestion.ok ? suggestion.value : null}
            />
          ) : null}
        </div>
        <BalanceSummary balance={balance} numbers={numbers} />
        <h3 className="font-medium">{t("receivables")}</h3>
        <ReceivableList
          {...{ balance, deposits, invoices, dates, numbers }}
          canWrite={canRequest}
        />
        <h3 className="font-medium">{t("plural")}</h3>
        <PaymentList payments={payments} dates={dates} numbers={numbers} />
      </section>
    </PaymentLinksProvider>
  );
}
