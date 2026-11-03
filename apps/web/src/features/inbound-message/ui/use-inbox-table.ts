import { useState } from "react";
import type { InboxRow } from "./inbox-row";
import type { InboxAbilities, InboxRowHandlers } from "./inbox-row-actions";
import { useMessageSheet } from "./use-message-sheet";
import { useReadMessage } from "./use-read-message";

/** The table's sheet, its delete confirmation and the row handlers each permission allows. */
export function useInboxTable({ canWrite, canDelete }: InboxAbilities) {
  const [deleting, setDeleting] = useState<InboxRow[] | null>(null);
  const sheet = useMessageSheet({ onDelete: ({ row }) => setDeleting([row]) });
  const { setRead } = useReadMessage();
  const handlers: InboxRowHandlers = {
    onSelect: sheet.select,
    ...(canWrite
      ? {
          onToggleRead: ({ row }: { row: InboxRow }) => setRead({ ids: [row.id], read: !row.read }),
        }
      : {}),
    ...(canDelete ? { onDelete: ({ row }: { row: InboxRow }) => setDeleting([row]) } : {}),
  };
  const bulk = {
    ...(canWrite ? { onMark: setRead } : {}),
    ...(canDelete ? { onDelete: setDeleting } : {}),
  };
  return { sheet, handlers, bulk, deleting, closeDelete: () => setDeleting(null) };
}
