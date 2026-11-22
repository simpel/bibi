import { listInboundMessages } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { SetupNotice } from "@/components/states/setup-notice";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { MessageList } from "./message-list";

export type OrderMessagesProps = {
  locale: Locale;
  orderId: string;
  /** `Order.inboundAddress`; null when inbound mail is not configured. */
  address: string | null;
};

const LIMIT = 50;

/**
 * The order's reply address and its messages of every channel (`inboundMessage.list`, ADR 0085);
 * hidden without `inbox:read`.
 */
export async function OrderMessages({ locale, orderId, address }: OrderMessagesProps) {
  const [t, dates, result] = await Promise.all([
    getTranslations("inbox"),
    getDateTimeFormat(),
    runOperation({ operation: listInboundMessages, input: { orderId, limit: LIMIT } }),
  ]);
  if (!result.ok && ["FORBIDDEN", "VALIDATION"].includes(result.error.code)) return null;
  if (!result.ok)
    return <ErrorState inline errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <section data-slot="order-messages" className="grid grid-cols-1 gap-3">
      <h2 className="text-xl">{t("orderTitle")}</h2>
      {address ? (
        <p className="text-sm text-muted-foreground">
          {t.rich("replyAddress", {
            address,
            code: (chunks) => <code className="text-foreground">{chunks}</code>,
          })}
        </p>
      ) : (
        <SetupNotice slot="no-reply-address">{t("noReplyAddress")}</SetupNotice>
      )}
      {/* Without an address and messages, the setup notice alone says why the list is empty. */}
      {address || result.value.items.length > 0 ? (
        <MessageList messages={result.value.items} dates={dates} />
      ) : null}
    </section>
  );
}
