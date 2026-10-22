"use client";

import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@bibi/ui";
import type { ChatStatus } from "ai";
import { useTranslations } from "next-intl";
import type { ComposerDraft } from "../state/use-prefill";
import { SkillPicker } from "./skill-picker";
import { useComposer } from "./use-composer";

export type ComposerProps = {
  status: ChatStatus;
  onSend: (input: { text: string }) => void;
  onStop: () => void;
  draft?: ComposerDraft | null | undefined;
};

/** AI Elements message box: Enter sends, Shift+Enter adds a line; while the model works a stop button shows. */
export function Composer({ status, onSend, onStop, draft }: ComposerProps) {
  const t = useTranslations("assistant");
  const { input, insert } = useComposer({ draft });
  const busy = status === "submitted" || status === "streaming";
  return (
    <div className="mx-auto w-full max-w-3xl p-4 pt-0">
      <PromptInput
        onSubmit={({ text }, event) => {
          if (busy) return;
          onSend({ text });
          event.currentTarget.reset();
        }}
      >
        <PromptInputBody>
          <PromptInputTextarea
            ref={input}
            placeholder={t("placeholder")}
            aria-label={t("placeholder")}
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <SkillPicker
              onPick={({ skill }) => insert({ text: t("skills.use", { name: skill.name }) })}
            />
          </PromptInputTools>
          <PromptInputSubmit
            status={status}
            onStop={onStop}
            aria-label={busy ? t("stop") : t("send")}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
