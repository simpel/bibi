"use client";

import { Button, Input, Suggestion, Suggestions } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";

const SUGGESTIONS = ["unsent", "changed", "needs"] as const;

/**
 * The page's lead: a question for the assistant. Asking opens it on `/assistant` with the
 * question sent (ADR 0110).
 */
export function AskBibi() {
  const t = useTranslations("myWork.ask");
  const { ask } = useAssistant();
  const [text, setText] = useState("");
  const question = text.trim();
  return (
    <section
      data-slot="my-work-ask"
      aria-labelledby="my-work-ask-title"
      className="grid gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-5"
    >
      <h2 id="my-work-ask-title" className="flex items-center gap-2 text-lg">
        <SparklesIcon className="size-5 text-primary" aria-hidden />
        {t("label")}
      </h2>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (question) ask({ text: question });
        }}
      >
        <Input
          id="my-work-ask"
          aria-label={t("label")}
          placeholder={t("placeholder")}
          value={text}
          onChange={(event) => setText(event.target.value)}
          className="h-12 bg-background text-base"
        />
        <Button type="submit" size="lg" className="h-12" disabled={question === ""}>
          {t("submit")}
        </Button>
      </form>
      <Suggestions>
        {SUGGESTIONS.map((key) => (
          <Suggestion
            key={key}
            suggestion={t(`suggestions.${key}`)}
            onClick={({ suggestion }) => ask({ text: suggestion })}
          />
        ))}
      </Suggestions>
    </section>
  );
}
