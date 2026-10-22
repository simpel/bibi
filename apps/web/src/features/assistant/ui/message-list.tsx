"use client";

import { ConversationContent, Message, MessageContent } from "@bibi/ui";
import type { ChatStatus, UIMessage } from "ai";
import { isTextUIPart } from "ai";
import { ChatError } from "./chat-error";
import { MessageParts } from "./message-parts";
import { ThinkingIndicator } from "./thinking-indicator";

export type MessageListProps = {
  messages: UIMessage[];
  status: ChatStatus;
  error: Error | undefined;
  onRetry: () => void;
};

const waitingForOutput = ({
  messages,
  status,
}: Pick<MessageListProps, "messages" | "status">): boolean => {
  if (status === "submitted") return true;
  const last = messages[messages.length - 1];
  return status === "streaming" && last?.role === "assistant" && last.parts.length === 0;
};

const userText = ({ message }: { message: UIMessage }): string =>
  message.parts
    .filter(isTextUIPart)
    .map((part) => part.text)
    .join("\n");

/** Transcript as AI Elements messages: user text in a bubble, assistant parts as flowing content. */
export function MessageList({ messages, status, error, onRetry }: MessageListProps) {
  return (
    <ConversationContent data-slot="assistant-messages">
      {messages.map((message) => (
        <Message key={message.id} from={message.role}>
          <MessageContent>
            {message.role === "user" ? userText({ message }) : <MessageParts message={message} />}
          </MessageContent>
        </Message>
      ))}
      {waitingForOutput({ messages, status }) ? <ThinkingIndicator /> : null}
      <ChatError error={error} onRetry={onRetry} />
    </ConversationContent>
  );
}
