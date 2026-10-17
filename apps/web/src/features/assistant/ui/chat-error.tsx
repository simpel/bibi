"use client";

import { Button, Message, MessageContent } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { assistantErrorKey } from "../lib/assistant-error";

export type ChatErrorProps = { error: Error | undefined; onRetry: () => void };

/** A failed turn (route error, network or stream failure) as an assistant message with a retry. */
export function ChatError({ error, onRetry }: ChatErrorProps) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  if (!error) return null;
  return (
    <Message from="assistant" role="alert">
      <MessageContent>
        <p>{t(assistantErrorKey({ error }))}</p>
        <Button size="sm" variant="outline" className="w-fit" onClick={onRetry}>
          {common("retry")}
        </Button>
      </MessageContent>
    </Message>
  );
}
