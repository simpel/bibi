import type { Locale } from "@bibi/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { INBOX_ROUTE, inboxMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { AttachedTicket } from "./attached-ticket";
import { loadTicketOptions } from "./load-ticket-options";
import { MessageActions } from "./message-actions";
import { MessageBody } from "./message-body";
import { MessageFacts } from "./message-facts";
import { openMessage } from "./open-message";

const BackLink = ({ label }: { label: string }) => (
  <Link
    href={INBOX_ROUTE}
    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
  >
    <ArrowLeftIcon className="size-4" />
    {label}
  </Link>
);

export type MessageDetailProps = { locale: Locale; id: string };

/** One inbound message, marked read on open: its content, and what to do with it while it has no ticket. */
export async function MessageDetail({ locale, id }: MessageDetailProps) {
  const [t, common, dates, abilities] = await Promise.all([
    getTranslations("inbox"),
    getTranslations("common"),
    getDateTimeFormat(),
    getCallerAbilities(),
  ]);
  const canWrite = can({ abilities, permission: "inbox:write" });
  const result = await openMessage({ id, canWrite });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const message = result.value;
  const canCreateTicket = can({ abilities, permission: "ticket:write" });
  const canDelete = can({ abilities, permission: "inbox:delete" });
  const tickets = !message.ticketId && canCreateTicket && canWrite ? await loadTicketOptions() : [];
  const title = message.subject ?? t("noSubject");
  return (
    <div className="grid gap-6">
      <CrumbName href={inboxMessageRoute({ id })} name={title} />
      <BackLink label={common("back")} />
      <PageHeader
        title={title}
        actions={
          message.ticketId ? undefined : (
            <MessageActions
              message={{ id, subject: message.subject, read: message.readAt !== null }}
              canWrite={canWrite}
              canDelete={canDelete}
              canCreateTicket={canCreateTicket}
              tickets={tickets}
            />
          )
        }
      />
      {message.ticketId ? <AttachedTicket ticketId={message.ticketId} /> : null}
      <MessageFacts message={message} dates={dates} />
      <MessageBody message={message} />
    </div>
  );
}
