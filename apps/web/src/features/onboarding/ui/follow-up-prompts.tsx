import { Suggestion, Suggestions } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import { latestSetupDraft } from "../lib/latest-setup-draft";

const FOLLOW_UPS = ["looksGood", "changeSell", "changeMoves"] as const;

/** Once the assistant has a ready first version: one-click follow-ups to change or accept it. */
export function FollowUpPrompts({ send }: { send: (input: { text: string }) => void }) {
  const t = useTranslations("onboarding.followUps");
  const { chat } = useAssistant().session;
  if (chat.status !== "ready" || latestSetupDraft({ messages: chat.messages }) === null) {
    return null;
  }
  return (
    <Suggestions className="px-4 pb-2" data-slot="onboarding-follow-ups">
      {FOLLOW_UPS.map((key) => (
        <Suggestion
          key={key}
          suggestion={t(key)}
          onClick={({ suggestion }) => send({ text: suggestion })}
        />
      ))}
    </Suggestions>
  );
}
