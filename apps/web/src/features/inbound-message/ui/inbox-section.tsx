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
  cursor: string | undefined;
  dates: DateTimeFormat;
  abilities: InboxAbilities;
};

/** The inbox's one table, read and unread together, newest first, so nothing moves. */
export async function InboxSection({ locale, cursor, dates, abilities }: InboxSectionProps) {
  const input = { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) };
  const result = await runOperation({ operation: listInboundMessages, input });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <div className="grid gap-3">
      <InboxTable
        tableId="inbox"
        rows={result.value.items.map((message) => toRow({ message, dates }))}
        {...abilities}
      />
      <CursorPagination
        pathname={INBOX_ROUTE}
        cursor={cursor}
        nextCursor={result.value.nextCursor}
      />
    </div>
  );
}
