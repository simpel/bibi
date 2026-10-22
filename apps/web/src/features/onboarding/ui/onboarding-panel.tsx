"use client";

import { SetupPanel, type SetupTarget } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { latestSetupDraft } from "../lib/setup-draft";
import { SetupComment } from "./setup-comment";

/** The first version, following the latest draft; a phase or item type can be pointed at and commented on. */
export function OnboardingPanel() {
  const t = useTranslations("onboarding");
  const { messages, status, sendMessage } = useAssistant().session.chat;
  const [selected, setSelected] = useState<SetupTarget | null>(null);
  const draft = latestSetupDraft({ messages });
  const send = ({ text }: { text: string }) => void sendMessage({ text });
  return (
    <SetupPanel
      itemTypes={draft?.itemTypes ?? null}
      phases={draft?.phases ?? []}
      selection={{
        selected,
        onSelect: ({ target }) => setSelected(target),
        renderComment: ({ target, close }) => (
          <SetupComment target={target} status={status} send={send} close={close} />
        ),
      }}
      labels={{
        empty: t("panelEmpty"),
        note: t("panelNote"),
        unsaved: t("panelUnsaved"),
        sell: t("panelSell"),
        path: t("panelPath"),
        hint: t("panelHint"),
      }}
    />
  );
}
