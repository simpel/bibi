import { type InboundMessageDto, listInboundMessages } from "@bibi/core";
import type { DateTimeFormat } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { CursorPagination } from "@/components/cursor-pagination";
import { ErrorState } from "@/components/states/error-state";
import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import type { InboxRow } from "./inbox-row";
import type { InboxAbilities } from "./inbox-row-actions";
import { InboxTable } from "./inbox-table";
import { senderOf } from "./message-value";

const PAGE_SIZE = 25;

type ToRowInput = { message: InboundMessageDto; dates: DateTimeFormat };

const toRow = ({ message, dates }: ToRowInput): InboxRow => ({
  id: message.id,
  channel: message.channel,
  subject: message.subject,
  sender: senderOf({ message }),
  receivedAt: message.receivedAt.toISOString(),
  receivedLabel: dates.dateTime({ instant: message.receivedAt }),
  read: message.readAt !== null,
  message,
});

export type InboxSectionProps = {
  locale: Locale;
  title: string;
  read: boolean;
  /** This table's own page cursor and its query-string name. */
  cursor: string | undefined;
  param: string;
  /** The other table's cursor, kept on this table's page links. */
  keep: Record<string, string>;
  dates: DateTimeFormat;
  abilities: InboxAbilities;
};

/** One of the inbox's two tables, unread or read, with its own pages. */
export async function InboxSection({
  locale,
  title,
  read,
  cursor,
  param,
  keep,
  dates,
  abilities,
}: InboxSectionProps) {
  const input = { limit: PAGE_SIZE, read, ...(cursor ? { cursor } : {}) };
  const result = await runOperation({ operation: listInboundMessages, input });
  return (
    <section className="grid gap-3">
      <h2 className="text-lg">{title}</h2>
      {result.ok ? (
        <>
          <InboxTable
            tableId={read ? "inbox-read" : "inbox"}
            rows={result.value.items.map((message) => toRow({ message, dates }))}
            {...abilities}
          />
          <CursorPagination
            pathname={INBOX_ROUTE}
            cursor={cursor}
            nextCursor={result.value.nextCursor}
            param={param}
            query={keep}
          />
        </>
      ) : (
        <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />
      )}
    </section>
  );
}
