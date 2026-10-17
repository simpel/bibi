"use client";

import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistant } from "../state/assistant-context";
import { ChatError } from "./chat-error";
import { Composer } from "./composer";
import { MessageList } from "./message-list";
import { SuggestedPrompts } from "./suggested-prompts";

function LoadingConversation() {
  const t = useTranslations("assistant");
  return (
    <output className="flex flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2Icon className="size-4 animate-spin" />
      {t("loadingConversation")}
    </output>
  );
}

/** The conversation: transcript (or the empty state), error line and message box. */
export function ChatView() {
  const { session, draft } = useAssistant();
  const { chat, loading } = session;
  const { messages, status, error, sendMessage, stop, regenerate } = chat;
  const send = ({ text }: { text: string }) => void sendMessage({ text });
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-slot="assistant-chat">
      {loading ? <LoadingConversation /> : null}
      {!loading && messages.length === 0 ? <SuggestedPrompts onPick={send} /> : null}
      {!loading && messages.length > 0 ? <MessageList messages={messages} status={status} /> : null}
      <ChatError error={error} onRetry={() => void regenerate()} />
      <Composer status={status} onSend={send} onStop={() => void stop()} draft={draft} />
    </div>
  );
}
