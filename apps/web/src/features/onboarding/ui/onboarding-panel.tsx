"use client";

import { SetupPanel } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { latestSetupDraft } from "../lib/setup-draft";

/** The first version, following the latest draft the assistant previewed in the chat. */
export function OnboardingPanel() {
  const t = useTranslations("onboarding");
  const { messages } = useAssistant().session.chat;
  const draft = latestSetupDraft({ messages });
  return (
    <SetupPanel
      itemTypes={draft?.itemTypes ?? null}
      phases={draft?.phases ?? []}
      labels={{
        empty: t("panelEmpty"),
        note: t("panelNote"),
        unsaved: t("panelUnsaved"),
        sell: t("panelSell"),
        path: t("panelPath"),
      }}
    />
  );
}
