/** A read state change the caller made: some ids, or all of them. */
export type NotificationMark = { ids: string[] | "all"; read: boolean; at: Date };

/** The rows with the mark applied, so a list shows it without asking the server again. */
export function applyMark<T extends { id: string; readAt: Date | string | null }>({
  rows,
  mark,
}: {
  rows: T[];
  mark: NotificationMark;
}): T[] {
  return rows.map((row) =>
    (mark.ids === "all" || mark.ids.includes(row.id)) && (row.readAt === null) === mark.read
      ? { ...row, readAt: mark.read ? mark.at : null }
      : row,
  );
}
