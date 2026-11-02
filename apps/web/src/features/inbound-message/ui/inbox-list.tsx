import { type InboundMessageDto, listInboundMessages } from "@bibi/core";
import type { DateTimeFormat } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { InboxAddress } from "./inbox-address";
import type { InboxRow } from "./inbox-row";
import { InboxTable } from "./inbox-table";
import { senderOf } from "./message-value";

export type InboxListProps = { locale: Locale; cursor?: string | undefined; dismissed: boolean };

const PAGE_SIZE = 25;

type ToRowInput = { message: InboundMessageDto; dates: DateTimeFormat };

const toRow = ({ message, dates }: ToRowInput): InboxRow => ({
  id: message.id,
  channel: message.channel,
  subject: message.subject,
  sender: senderOf({ message }),
  receivedAt: message.receivedAt.toISOString(),
  receivedLabel: dates.dateTime({ instant: message.receivedAt }),
  dismissed: message.dismissedAt !== null,
});

/** Open and Dismissed views of the inbox, as links (a filter stays a query, ADR 0064). */
async function ViewLinks({ dismissed }: { dismissed: boolean }) {
  const t = await getTranslations("inbox");
  const style = ({ active }: { active: boolean }) =>
    active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground";
  return (
    <nav className="flex gap-4 text-sm" aria-label={t("views")}>
      <Link href={INBOX_ROUTE} className={style({ active: !dismissed })}>
        {t("open")}
      </Link>
      <Link href={`${INBOX_ROUTE}?view=dismissed`} className={style({ active: dismissed })}>
        {t("dismissedView")}
      </Link>
    </nav>
  );
}

/** The inbox page body (ADR 0085): its address, the views and the messages without a ticket. */
export async function InboxList({ locale, cursor, dismissed }: InboxListProps) {
  const [t, dates, abilities] = await Promise.all([
    getTranslations("inbox"),
    getDateTimeFormat(),
    getCallerAbilities(),
  ]);
  const input = { limit: PAGE_SIZE, dismissed, ...(cursor ? { cursor } : {}) };
  const result = await runOperation({ operation: listInboundMessages, input });
  const header = <PageHeader title={t("title")} description={t("description")} />;
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return (
      <div className="grid gap-6">
        {header}
        <ErrorState errorKey={errorKey} />
      </div>
    );
  }
  const rows = result.value.items.map((message) => toRow({ message, dates }));
  return (
    <div className="grid gap-6">
      {header}
      <InboxAddress />
      <ViewLinks dismissed={dismissed} />
      <InboxTable
        rows={rows}
        canWrite={can({ abilities, permission: "inbox:write" })}
        canCreateTicket={can({ abilities, permission: "ticket:write" })}
      />
      <CursorPagination
        pathname={INBOX_ROUTE}
        cursor={cursor}
        nextCursor={result.value.nextCursor}
        {...(dismissed ? { query: { view: "dismissed" } } : {})}
      />
    </div>
  );
}
