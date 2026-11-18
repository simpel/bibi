"use client";

import { CommandGroup, CommandItem } from "@bibi/ui";
import { MessageSquareIcon, SquarePenIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type AskAssistantGroupProps = {
  query: string;
  onAsk: (input: { text: string }) => void;
};

/**
 * The assistant entry. With no text it creates a chat. With text it asks the assistant in a new
 * conversation on the assistant page. Its cmdk `value` never matches the query, so it scores 0 and
 * sorts after every matching command (which stays preselected); `forceMount` on the item and its
 * group keeps it visible (cmdk hides a group with no scoring item), so
 * when no command matches it is the only item and Enter starts the chat.
 */
export function AskAssistantGroup({ query, onAsk }: AskAssistantGroupProps) {
  const t = useTranslations("commandBar");
  const nav = useTranslations("nav");
  const text = query.trim();
  return (
    <CommandGroup forceMount heading={t("assistant")}>
      {text ? (
        <CommandItem forceMount value="ask-assistant" onSelect={() => onAsk({ text })}>
          <MessageSquareIcon />
          {t("askAssistant", { query: text })}
        </CommandItem>
      ) : (
        <CommandItem value="create-chat" onSelect={() => onAsk({ text: "" })}>
          <SquarePenIcon />
          {nav("newChat")}
        </CommandItem>
      )}
    </CommandGroup>
  );
}
