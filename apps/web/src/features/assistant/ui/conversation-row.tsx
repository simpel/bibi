"use client";

import { Button } from "@bibi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { ConversationSummary } from "../actions";

export type ConversationRowProps = {
  conversation: ConversationSummary;
  active: boolean;
  onOpen: () => void;
  onRename: () => void;
  onArchive: () => void;
};

/** One history entry: open it, rename it or archive it. */
export function ConversationRow({
  conversation,
  active,
  onOpen,
  onRename,
  onArchive,
}: ConversationRowProps) {
  const t = useTranslations("assistant.history");
  const format = useFormatter();
  const updated = format.dateTime(new Date(conversation.updatedAt), {
    dateStyle: "medium",
    timeStyle: "short",
  });
  return (
    <li
      data-slot="conversation-row"
      data-active={active || undefined}
      className="flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent data-[active]:bg-accent"
    >
      <button type="button" onClick={onOpen} className="grid min-w-0 flex-1 text-left">
        <span className="truncate text-sm font-medium">{conversation.title}</span>
        <span className="text-xs text-muted-foreground">{updated}</span>
      </button>
      <Button variant="ghost" size="icon" aria-label={t("rename")} onClick={onRename}>
        <PencilIcon />
      </Button>
      <Button variant="ghost" size="icon" aria-label={t("archive")} onClick={onArchive}>
        <ArchiveIcon />
      </Button>
    </li>
  );
}
