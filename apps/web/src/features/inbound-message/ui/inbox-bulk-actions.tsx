"use client";

import { Button } from "@bibi/ui";
import { MailCheckIcon, MailIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { InboxRow } from "./inbox-row";

export type InboxBulkActionsProps = {
  rows: InboxRow[];
  /** Left out without `inbox:write`. */
  onMark?: (input: { ids: string[]; read: boolean }) => void;
  /** Left out without `inbox:delete`; it opens the confirmation. */
  onDelete?: (rows: InboxRow[]) => void;
};

/** Mark the selected messages read or unread, or delete them: the same bar as notifications. */
export function InboxBulkActions({ rows, onMark, onDelete }: InboxBulkActionsProps) {
  const common = useTranslations("common");
  const ids = rows.map((row) => row.id);
  return (
    <>
      {onMark ? (
        <>
          <Button size="sm" variant="outline" onClick={() => onMark({ ids, read: true })}>
            <MailCheckIcon />
            {common("markRead")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onMark({ ids, read: false })}>
            <MailIcon />
            {common("markUnread")}
          </Button>
        </>
      ) : null}
      {onDelete ? (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive"
          onClick={() => onDelete(rows)}
        >
          <Trash2Icon />
          {common("delete")}
        </Button>
      ) : null}
    </>
  );
}
