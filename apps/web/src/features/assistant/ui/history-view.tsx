"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { useAssistant } from "../state/assistant-context";
import { ArchiveConversationDialog } from "./archive-conversation-dialog";
import { type EditingConversation, HistoryList } from "./history-list";

/** Conversation history: open, rename and archive earlier conversations, or start a new one. */
export function HistoryView() {
  const t = useTranslations("assistant.history");
  const { conversations, newConversation } = useAssistant();
  const { items, loading, errorKey, refresh } = conversations;
  const [editing, setEditing] = useState<EditingConversation>(null);
  useEffect(() => void refresh(), [refresh]);
  const archiving =
    editing?.mode === "archive" ? items.find((item) => item.id === editing.id) : undefined;
  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-3"
      data-slot="assistant-history"
    >
      <Button variant="outline" size="sm" className="justify-start" onClick={newConversation}>
        <PlusIcon />
        {t("new")}
      </Button>
      <InlineLoadError errorKey={errorKey} />
      {items.length === 0 && !loading ? (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}
      <HistoryList editing={editing} onEdit={setEditing} />
      <ArchiveConversationDialog conversation={archiving} onClose={() => setEditing(null)} />
    </div>
  );
}
