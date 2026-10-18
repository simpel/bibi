import { listInboundEmails } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
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
  const t = await getTranslations("inboundEmail");
  const result = await runOperation({
    operation: listInboundEmails,
    input: { ticketId, limit: LIMIT },
  });
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
      <InboundEmailList emails={result.value.items} />
    </section>
  );
}
