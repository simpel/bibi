"use client";

import { Button } from "@bibi/ui";
import { ArchiveIcon, PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
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
  const format = useDateTimeFormat();
  const updated = format.dateTime({ instant: conversation.updatedAt });
  return (
    <li
      data-slot="conversation-row"
      data-active={active || undefined}
      className="group flex items-center gap-1 rounded-md px-2 py-1.5 hover:bg-accent data-[active]:bg-accent"
    >
      <button type="button" onClick={onOpen} className="grid min-w-0 flex-1 text-left">
        <span className="truncate text-sm font-medium">{conversation.title}</span>
        <span className="text-xs text-muted-foreground">{updated}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("rename")}
        onClick={onRename}
        className="md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        <PencilIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("archive")}
        onClick={onArchive}
        className="md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100"
      >
        <ArchiveIcon />
      </Button>
    </li>
  );
}
