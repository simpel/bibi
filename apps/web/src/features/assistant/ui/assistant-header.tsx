"use client";

import { Button } from "@okazi/ui";
import { ArrowLeftIcon, HistoryIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";

/** Title row: new conversation and history toggle. */
export function AssistantHeader() {
  const t = useTranslations("assistant");
  const { view, setView, newConversation } = useAssistant();
  const inHistory = view === "history";
  return (
    <header className="flex items-center gap-1 border-b px-3 py-2">
      <SparklesIcon className="size-4 text-primary" />
      <h2 className="flex-1 truncate font-serif text-base">{t("title")}</h2>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("newConversation")}
        onClick={newConversation}
      >
        <PlusIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={inHistory ? t("backToChat") : t("history.title")}
        aria-pressed={inHistory}
        onClick={() => setView({ view: inHistory ? "chat" : "history" })}
      >
        {inHistory ? <ArrowLeftIcon /> : <HistoryIcon />}
      </Button>
    </header>
  );
}
