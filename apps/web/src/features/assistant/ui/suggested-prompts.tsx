"use client";

import { ConversationEmptyState, Suggestion, Suggestions } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type SuggestedPromptsProps = { onPick: (input: { text: string }) => void };

const KEYS = ["listVenues", "createVenue", "findItems", "listSkills"] as const;

/** Empty state: what the assistant can do, as one-click prompts (sv/en). */
export function SuggestedPrompts({ onPick }: SuggestedPromptsProps) {
  const t = useTranslations("assistant");
  return (
    <ConversationEmptyState
      data-slot="assistant-empty"
      title={t("emptyTitle")}
      description={t("emptyDescription")}
    >
      <div className="grid justify-items-center gap-3">
        <SparklesIcon className="size-8 text-primary" />
        <h3 className="font-serif text-2xl">{t("emptyTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
        <Suggestions className="mt-2 max-w-2xl">
          {KEYS.map((key) => (
            <Suggestion
              key={key}
              suggestion={t(`suggestions.${key}`)}
              onClick={({ suggestion }) => onPick({ text: suggestion })}
            />
          ))}
        </Suggestions>
      </div>
    </ConversationEmptyState>
  );
}
