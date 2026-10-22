"use client";

import { Conversation, ConversationScrollButton } from "@bibi/ui";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useAssistant } from "../state/assistant-context";
import { QuietToolsContext } from "../state/quiet-tools-context";
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

export type ChatViewProps = {
  /** Replaces the default suggested prompts while the conversation is empty; receives a sender. */
  renderEmpty?: (input: { send: (input: { text: string }) => void }) => ReactNode;
  /** Shown above the prompt box once the conversation has started, e.g. follow-up prompts. */
  renderFooter?: (input: { send: (input: { text: string }) => void }) => ReactNode;
  /** Tools whose calls are not shown as cards in this chat. */
  quietTools?: readonly string[];
};

const NO_QUIET_TOOLS: readonly string[] = [];

/** The conversation as AI Elements: scrolling transcript (or the empty state), error line and prompt box. */
export function ChatView({
  renderEmpty,
  renderFooter,
  quietTools = NO_QUIET_TOOLS,
}: ChatViewProps) {
  const { session, draft } = useAssistant();
  const { chat, loading } = session;
  const { messages, status, error, sendMessage, stop, regenerate } = chat;
  const send = ({ text }: { text: string }) => void sendMessage({ text });
  const empty = !loading && messages.length === 0;
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-slot="assistant-chat">
      {loading ? <LoadingConversation /> : null}
      {empty ? (renderEmpty?.({ send }) ?? <SuggestedPrompts onPick={send} />) : null}
      {!loading && !empty ? (
        <QuietToolsContext value={quietTools}>
          <Conversation>
            <MessageList
              messages={messages}
              status={status}
              error={error}
              onRetry={() => void regenerate()}
            />
            <ConversationScrollButton />
          </Conversation>
        </QuietToolsContext>
      ) : null}
      {!loading && !empty ? renderFooter?.({ send }) : null}
      <Composer status={status} onSend={send} onStop={() => void stop()} draft={draft} />
    </div>
  );
}
