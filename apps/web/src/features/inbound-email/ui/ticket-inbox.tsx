import { listInboundEmails } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { InboundEmailList } from "./inbound-email-list";

export type TicketInboxProps = {
  locale: Locale;
  ticketId: string;
  /** `Ticket.inboundAddress`; null when inbound mail is not configured. */
  address: string | null;
};

const LIMIT = 50;

/** The ticket's reply address and the mails received on it (`inboundEmail.list`, ADR 0012). */
export async function TicketInbox({ locale, ticketId, address }: TicketInboxProps) {
  const [t, dates] = await Promise.all([getTranslations("inboundEmail"), getDateTimeFormat()]);
  const result = await runOperation({
    operation: listInboundEmails,
    input: { ticketId, limit: LIMIT },
  });
  if (!result.ok && result.error.code === "FORBIDDEN") return null;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="ticket-inbox" className="grid gap-3">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="text-sm text-muted-foreground">
        {address
          ? t.rich("address", {
              address,
              code: (chunks) => <code className="text-foreground">{chunks}</code>,
            })
          : t("noAddress")}
      </p>
      <InboundEmailList emails={result.value.items} dates={dates} />
    </section>
  );
}
