import { getInboundMessage } from "@bibi/core";
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
import { runOperation } from "@/server/run-operation";
import { AttachedTicket } from "./attached-ticket";
import { loadTicketOptions } from "./load-ticket-options";
import { MessageActions } from "./message-actions";
import { MessageEntry } from "./message-entry";

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

/** One inbound message: its content, and what to do with it while it has no ticket. */
export async function MessageDetail({ locale, id }: MessageDetailProps) {
  const [t, common, dates, abilities] = await Promise.all([
    getTranslations("inbox"),
    getTranslations("common"),
    getDateTimeFormat(),
    getCallerAbilities(),
  ]);
  const result = await runOperation({ operation: getInboundMessage, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const message = result.value;
  const canTicket = can({ abilities, permission: "ticket:write" });
  const canWrite = can({ abilities, permission: "inbox:write" });
  const tickets = !message.ticketId && canTicket && canWrite ? await loadTicketOptions() : [];
  const title = message.subject ?? t("noSubject");
  return (
    <div className="grid gap-6">
      <CrumbName href={inboxMessageRoute({ id })} name={title} />
      <BackLink label={common("back")} />
      <PageHeader title={title} />
      {message.ticketId ? (
        <AttachedTicket ticketId={message.ticketId} />
      ) : (
        <MessageActions
          id={message.id}
          dismissed={message.dismissedAt !== null}
          canTicket={canTicket}
          canWrite={canWrite}
          tickets={tickets}
        />
      )}
      <MessageEntry message={message} dates={dates} />
    </div>
  );
}
