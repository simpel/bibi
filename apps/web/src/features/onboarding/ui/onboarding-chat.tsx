"use client";

import { ConversationEmptyState } from "@okazi/ui";
import { SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { ChatView } from "@/features/assistant/ui/chat-view";

/** The shared chat, with a welcome as its empty state. */
export function OnboardingChat() {
  const t = useTranslations("onboarding");
  return (
    <ChatView
      renderEmpty={() => (
        <ConversationEmptyState
          title={t("welcomeTitle")}
          description={t("welcomeDescription")}
          icon={<SparklesIcon className="size-8" />}
        />
      )}
    />
  );
}
