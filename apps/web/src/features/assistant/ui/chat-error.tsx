"use client";

import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { assistantErrorKey } from "../lib/assistant-error";

export type ChatErrorProps = { error: Error | undefined; onRetry: () => void };

/** Failed turn (route error, network or stream failure) mapped to a localized message + retry. */
export function ChatError({ error, onRetry }: ChatErrorProps) {
  const t = useTranslations("errors");
  const common = useTranslations("common");
  if (!error) return null;
  return (
    <div
      role="alert"
      className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      <span>{t(assistantErrorKey({ error }))}</span>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {common("retry")}
      </Button>
    </div>
  );
}
