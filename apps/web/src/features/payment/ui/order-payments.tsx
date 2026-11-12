import {
  type DepositSuggestion,
  getOrderBalance,
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
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { getNumberFormat } from "@/server/number-format";
import { runOperation } from "@/server/run-operation";
import { BalanceSummary } from "./balance-summary";
import { ConnectLedgerNotice } from "./connect-ledger-notice";
import { CreateInvoiceButton } from "./create-invoice-button";
import { PaymentLinksProvider } from "./payment-links-context";
import { PaymentList } from "./payment-list";
import { ReceivableList } from "./receivable-list";

export type OrderPaymentsProps = { locale: Locale; orderId: string; canRequest: boolean };

const LIMIT = 50;

/** Every money read of the order at once: balance, receivables and payments (ADR 0057). */
async function loadMoney({ orderId }: { orderId: string }) {
  const page = { orderId, limit: LIMIT };
  const [balance, deposits, invoices, payments] = await Promise.all([
    runOperation({ operation: getOrderBalance, input: { orderId } }),
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

type PaymentActionsProps = { orderId: string; suggestion: DepositSuggestion | null };

/** New requests on the order: a fixed deposit, a deposit with a payment link, an invoice. */
async function PaymentActions({ orderId, suggestion }: PaymentActionsProps) {
  const deposit = await getTranslations("deposit");
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" asChild>
        <Link href={depositNewRoute({ orderId })}>
          <HandCoinsIcon />
          {deposit("create")}
        </Link>
      </Button>
      {suggestion ? <RequestDeposit orderId={orderId} suggestion={suggestion} /> : null}
      <CreateInvoiceButton orderId={orderId} />
    </div>
  );
}

/** What the order's customer owes and has paid, what it pays for, and new requests. */
export async function OrderPayments({ locale, orderId, canRequest }: OrderPaymentsProps) {
  // Payment links need a connected provider that takes a payment method (ADR 0090, 0100).
  const [t, dates, numbers, result, suggestion, abilities] = await Promise.all([
    getTranslations("payment"),
    getDateTimeFormat(),
    getNumberFormat(),
    loadMoney({ orderId }),
    runOperation({ operation: suggestDepositAmount, input: { orderId } }),
    getCallerAbilities(),
  ]);
  if (!result.ok && result.error.code === "FORBIDDEN") return null;
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  const { balance, deposits, invoices, payments } = result.value;
  const available = !suggestion.ok || suggestion.value.paymentLinksAvailable;
  // Money needs a connected accounting system (ADR 0106): without one, say so instead.
  const noLedger = suggestion.ok && !suggestion.value.ledgerConnected;
  const canConnect = can({ abilities, permission: "integration:write" });
  return (
    <PaymentLinksProvider available={available}>
      <section data-slot="order-payments" className="grid grid-cols-1 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">{t("balance.title")}</h2>
          {canRequest && !noLedger ? (
            <PaymentActions
              orderId={orderId}
              suggestion={suggestion.ok ? suggestion.value : null}
            />
          ) : null}
        </div>
        {canRequest && noLedger ? <ConnectLedgerNotice canConnect={canConnect} /> : null}
        <BalanceSummary balance={balance} numbers={numbers} />
        <h3 className="font-medium">{t("receivables")}</h3>
        <ReceivableList
          {...{ balance, deposits, invoices, dates, numbers }}
          canWrite={canRequest}
        />
        <h3 className="font-medium">{t("plural")}</h3>
        <PaymentList payments={payments} dates={dates} numbers={numbers} canWrite={canRequest} />
      </section>
    </PaymentLinksProvider>
  );
}
