"use client";

import { useTranslations } from "next-intl";
import type { ErrorKey } from "@/lib/error-key";

export type InlineLoadErrorProps = { errorKey: ErrorKey | null };

/**
 * Client-side load failure (history list, live search) in place of the content. Not for form
 * or action outcomes: those are toasts (CLAUDE.md "Formulär").
 */
export function InlineLoadError({ errorKey }: InlineLoadErrorProps) {
  const t = useTranslations("errors");
  if (!errorKey) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
    >
      {t(errorKey)}
    </p>
  );
}
