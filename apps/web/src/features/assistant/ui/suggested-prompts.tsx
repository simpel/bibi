"use client";

import { Button } from "@okazi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type SuggestedPromptsProps = { onPick: (input: { text: string }) => void };

const KEYS = ["listVenues", "createVenue", "findItems", "listSkills"] as const;

/** Empty state: what the assistant can do, as one-click prompts (sv/en). */
export function SuggestedPrompts({ onPick }: SuggestedPromptsProps) {
  const t = useTranslations("assistant");
  return (
    <div
      className="flex flex-1 flex-col justify-center gap-4 px-4 py-6"
      data-slot="assistant-empty"
    >
      <div className="grid justify-items-center gap-1 text-center">
        <SparklesIcon className="size-6 text-primary" />
        <h3 className="font-serif text-lg">{t("emptyTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("emptyDescription")}</p>
      </div>
      <div className="grid gap-2">
        {KEYS.map((key) => (
          <Button
            key={key}
            variant="outline"
            className="h-auto justify-start whitespace-normal py-2 text-left font-normal"
            onClick={() => onPick({ text: t(`suggestions.${key}`) })}
          >
            {t(`suggestions.${key}`)}
          </Button>
        ))}
      </div>
    </div>
  );
}
