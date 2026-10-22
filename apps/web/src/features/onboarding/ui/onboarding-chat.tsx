"use client";

import { ConversationEmptyState, Suggestion, Suggestions } from "@bibi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChatView } from "@/features/assistant/ui/chat-view";
import { FollowUpPrompts } from "./follow-up-prompts";

type Send = (input: { text: string }) => void;

const STARTERS = ["start", "conference", "restaurant"] as const;

/** The skill's instructions and the drafts stay out of the chat; the panel shows the result. */
const QUIET_TOOLS = [
  "load_skill",
  "skill_search",
  "pipelineSetup_presetDraft",
  "pipelineSetup_preview",
] as const;

/** The welcome, with one-click ways to start the first setup. */
function Welcome({ send }: { send: Send }) {
  const t = useTranslations("onboarding");
  return (
    <ConversationEmptyState title={t("welcomeTitle")} description={t("welcomeDescription")}>
      <div className="grid justify-items-center gap-3">
        <SparklesIcon className="size-8 text-primary" />
        <h3 className="font-serif text-2xl">{t("welcomeTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("welcomeDescription")}</p>
        <Suggestions className="mt-2 max-w-xl" data-slot="onboarding-starters">
          {STARTERS.map((key) => (
            <Suggestion
              key={key}
              suggestion={t(`starters.${key}`)}
              onClick={({ suggestion }) => send({ text: suggestion })}
            />
          ))}
        </Suggestions>
      </div>
    </ConversationEmptyState>
  );
}

/** The shared chat on `/onboarding`: the assistant runs the first setup (ADR 0045). */
export function OnboardingChat() {
  return (
    <ChatView
      renderEmpty={({ send }) => <Welcome send={send} />}
      renderFooter={({ send }) => <FollowUpPrompts send={send} />}
      quietTools={QUIET_TOOLS}
    />
  );
}
