"use client";

import { Button } from "@okazi/ui";
import { ArrowLeftIcon, HistoryIcon, PlusIcon, SparklesIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";

export type AssistantHeaderProps = {
  /** The docked panel has its own close button; the sheet brings one. */
  showClose: boolean;
};

/** Title row: new conversation, history toggle and (docked) close. */
export function AssistantHeader({ showClose }: AssistantHeaderProps) {
  const t = useTranslations("assistant");
  const { view, setView, setOpen, newConversation } = useAssistant();
  const inHistory = view === "history";
  return (
    <header className="flex items-center gap-1 border-b px-3 py-2 pr-12 md:pr-3">
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
      {showClose ? (
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("close")}
          onClick={() => setOpen({ open: false })}
        >
          <XIcon />
        </Button>
      ) : null}
    </header>
  );
}
