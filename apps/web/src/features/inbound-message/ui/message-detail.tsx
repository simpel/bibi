import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { AttachedOrder } from "./attached-order";
import { loadOrderOptions } from "./load-order-options";
import { MessageActions } from "./message-actions";
import { MessageView, receivedText } from "./message-view";
import { openMessage } from "./open-message";

export type MessageDetailProps = { locale: Locale; id: string };

/** One inbound message, marked read on open: its content, and what to do with it while it has no order. */
export async function MessageDetail({ locale, id }: MessageDetailProps) {
  const [t, dates, abilities] = await Promise.all([
    getTranslations("inbox"),
    getDateTimeFormat(),
    getCallerAbilities(),
  ]);
  const canWrite = can({ abilities, permission: "inbox:write" });
  const result = await openMessage({ id, canWrite });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const message = result.value;
  const canCreateOrder = can({ abilities, permission: "order:write" });
  const canDelete = can({ abilities, permission: "inbox:delete" });
  const orders = !message.orderId && canCreateOrder && canWrite ? await loadOrderOptions() : [];
  const title = message.subject ?? t("noSubject");
  return (
    <div className="grid gap-6">
      <CrumbName href={inboxMessageRoute({ id })} name={title} />
      <PageHeader
        title={title}
        actions={
          message.orderId ? undefined : (
            <MessageActions
              message={{ id, subject: message.subject, read: message.readAt !== null }}
              canWrite={canWrite}
              canDelete={canDelete}
              canCreateOrder={canCreateOrder}
              orders={orders}
            />
          )
        }
      />
      {message.orderId ? <AttachedOrder orderId={message.orderId} /> : null}
      <MessageView message={message} received={receivedText({ message, dates })} />
    </div>
  );
}
