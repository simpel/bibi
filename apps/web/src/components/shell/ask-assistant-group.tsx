"use client";

import { CommandGroup, CommandItem } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type AskAssistantGroupProps = {
  query: string;
  onAsk: (input: { text: string }) => void;
};

/**
 * "Ask assistant": free text + Enter sends a one-shot question (new conversation) and goes to
 * the start page where it is answered. The item's cmdk `value` is the query itself so it scores best and is preselected,
 * and `forceMount` keeps it visible whatever the navigation filter says.
 */
export function AskAssistantGroup({ query, onAsk }: AskAssistantGroupProps) {
  const t = useTranslations("commandBar");
  const text = query.trim();
  return (
    <CommandGroup heading={t("assistant")}>
      {text ? (
        <CommandItem forceMount value={text} onSelect={() => onAsk({ text })}>
          <SparklesIcon />
          {t("askAssistant", { query: text })}
        </CommandItem>
      ) : (
        <CommandItem value="open-assistant" onSelect={() => onAsk({ text: "" })}>
          <SparklesIcon />
          {t("openAssistant")}
        </CommandItem>
      )}
    </CommandGroup>
  );
}
