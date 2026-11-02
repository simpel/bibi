import { listInboundMessages } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { MessageList } from "./message-list";

export type TicketMessagesProps = {
  locale: Locale;
  ticketId: string;
  /** `Ticket.inboundAddress`; null when inbound mail is not configured. */
  address: string | null;
};

const LIMIT = 50;

/**
 * The ticket's reply address and its messages of every channel (`inboundMessage.list`, ADR 0085);
 * hidden without `inbox:read`.
 */
export async function TicketMessages({ locale, ticketId, address }: TicketMessagesProps) {
  const [t, dates] = await Promise.all([getTranslations("inbox"), getDateTimeFormat()]);
  const result = await runOperation({
    operation: listInboundMessages,
    input: { ticketId, limit: LIMIT },
  });
  if (!result.ok && ["FORBIDDEN", "VALIDATION"].includes(result.error.code)) return null;
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="ticket-messages" className="grid grid-cols-1 gap-3">
      <h2 className="text-xl">{t("ticketTitle")}</h2>
      <p className="text-sm text-muted-foreground">
        {address
          ? t.rich("replyAddress", {
              address,
              code: (chunks) => <code className="text-foreground">{chunks}</code>,
            })
          : t("noReplyAddress")}
      </p>
      <MessageList messages={result.value.items} dates={dates} />
    </section>
  );
}
