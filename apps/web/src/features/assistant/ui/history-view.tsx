"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { InlineLoadError } from "@/components/states/inline-load-error";
import { useAssistant } from "../state/assistant-context";
import { ArchiveConversationDialog } from "./archive-conversation-dialog";
import { type EditingConversation, HistoryList } from "./history-list";

/** Full-page conversation history: open, rename and archive earlier conversations, or start a new one. */
export function HistoryView() {
  const t = useTranslations("assistant.history");
  const { conversations, newConversation, goHome } = useAssistant();
  const { items, loading, errorKey, refresh } = conversations;
  const [editing, setEditing] = useState<EditingConversation>(null);
  useEffect(() => void refresh(), [refresh]);
  const archiving =
    editing?.mode === "archive" ? items.find((item) => item.id === editing.id) : undefined;
  const startNew = () => {
    newConversation();
    goHome();
  };
  return (
    <section className="grid gap-4" data-slot="assistant-history">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-serif text-2xl">{t("title")}</h1>
        <Button variant="outline" size="sm" onClick={startNew}>
          <PlusIcon />
          {t("new")}
        </Button>
      </div>
      <InlineLoadError errorKey={errorKey} />
      {items.length === 0 && !loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
      ) : null}
      <HistoryList editing={editing} onEdit={setEditing} />
      <ArchiveConversationDialog conversation={archiving} onClose={() => setEditing(null)} />
    </section>
  );
}
