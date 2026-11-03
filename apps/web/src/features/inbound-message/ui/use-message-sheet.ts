import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { markMessageReadAction } from "../actions";
import type { InboxRow } from "./inbox-row";
import { useReadMessage } from "./use-read-message";

/**
 * The sheet's message: opening an unread one marks it read for the team quietly (opening is
 * reading, ADR 0085), closing reads the page again so it moves to Read, and the sheet can mark
 * it unread or hand it to the delete confirmation.
 */
export function useMessageSheet({ onDelete }: { onDelete: (row: InboxRow) => void }) {
  const router = useRouter();
  const { setRead } = useReadMessage();
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const select = ({ row }: { row: InboxRow }) => {
    if (!row.read) void markMessageReadAction({ id: row.id });
    setSelected(row);
  };
  const close = () => {
    const wasUnread = selected !== null && !selected.read;
    setSelected(null);
    if (wasUnread) router.refresh();
  };
  const markUnread = ({ row }: { row: InboxRow }) => {
    setSelected(null);
    setRead({ id: row.id, read: false });
  };
  const remove = ({ row }: { row: InboxRow }) => {
    setSelected(null);
    onDelete(row);
  };
  return { selected, select, close, markUnread, remove };
}
