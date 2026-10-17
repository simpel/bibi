"use client";

import { Shimmer } from "@okazi/ui";
import { useTranslations } from "next-intl";

/** "Thinking…" while the model has not produced output yet. */
export function ThinkingIndicator() {
  const t = useTranslations("assistant");
  return (
    <output>
      <Shimmer>{t("thinking")}</Shimmer>
    </output>
  );
}
