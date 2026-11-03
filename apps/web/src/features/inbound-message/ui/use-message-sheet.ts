import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { markMessageReadAction } from "../actions";
import type { InboxRow } from "./inbox-row";
import { useReadMessage } from "./use-read-message";

/**
 * The sheet's message. Opening an unread one marks it read for the team first (opening is
 * reading, ADR 0085): the row is pending (`openingId`) while the server action runs, then the
 * page reads again, the row turns read in place and the sheet opens. Nothing moves.
 */
export function useMessageSheet({ onDelete }: { onDelete: (row: InboxRow) => void }) {
  const router = useRouter();
  const { setRead } = useReadMessage();
  const [selected, setSelected] = useState<InboxRow | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const select = async ({ row }: { row: InboxRow }) => {
    if (openingId) return;
    if (row.read) return setSelected(row);
    setOpeningId(row.id);
    const result = await markMessageReadAction({ id: row.id }).catch(() => null);
    setOpeningId(null);
    if (result?.ok) router.refresh();
    setSelected({ ...row, read: result?.ok === true });
  };
  const close = () => setSelected(null);
  const markUnread = ({ row }: { row: InboxRow }) => {
    setSelected(null);
    setRead({ id: row.id, read: false });
  };
  const remove = ({ row }: { row: InboxRow }) => {
    setSelected(null);
    onDelete(row);
  };
  return { selected, openingId, select, close, markUnread, remove };
}
