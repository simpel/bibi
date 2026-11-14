"use client";

import { Button, Input, Suggestion, Suggestions } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";

const SUGGESTIONS = ["unsent", "changed", "needs"] as const;

/** A question for the assistant; asking opens it on `/assistant` with the question sent (ADR 0110). */
export function AskBibi() {
  const t = useTranslations("myWork.ask");
  const { ask } = useAssistant();
  const [text, setText] = useState("");
  const question = text.trim();
  return (
    <section data-slot="my-work-ask" aria-label={t("label")} className="grid gap-2">
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
        />
        <Button type="submit" disabled={question === ""}>
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
