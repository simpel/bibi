"use client";

import { useTranslations } from "next-intl";

/** "Thinking…" with three pulsing dots while the model has not produced output yet. */
export function ThinkingIndicator() {
  const t = useTranslations("assistant");
  return (
    <output className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
        <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:150ms]" />
        <span className="size-1.5 animate-pulse rounded-full bg-current [animation-delay:300ms]" />
      </span>
      {t("thinking")}
    </output>
  );
}
