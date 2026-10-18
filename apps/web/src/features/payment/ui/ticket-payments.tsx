import { listPayments } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { PaymentList } from "./payment-list";
import { RequestPaymentButton } from "./request-payment-button";

export type TicketPaymentsProps = { locale: Locale; ticketId: string; canRequest: boolean };

const LIMIT = 50;

/** Payments requested from the ticket's customer (`payment.list`), and a new request. */
export async function TicketPayments({ locale, ticketId, canRequest }: TicketPaymentsProps) {
  const t = await getTranslations("payment");
  const result = await runOperation({
    operation: listPayments,
    input: { ticketId, limit: LIMIT },
  });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="ticket-payments" className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{t("plural")}</h2>
        {canRequest ? <RequestPaymentButton ticketId={ticketId} /> : null}
      </div>
      <PaymentList payments={result.value.items} />
    </section>
  );
}
