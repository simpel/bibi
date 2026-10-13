"use client";

import { useTranslations } from "next-intl";
import { errorKeyForCode, parseAppErrorCode } from "@/lib/error-key";
import type { GenerativeProps } from "./generative-props";

export type ErrorViewProps = GenerativeProps<"error">;

/** A tool that failed: the localized meaning of the AppError code, plus the tool's message. */
export function ErrorView({ code, message }: ErrorViewProps) {
  const t = useTranslations("errors");
  const key = errorKeyForCode({ code: parseAppErrorCode({ value: code }) ?? "INTERNAL" });
  return (
    <div
      role="alert"
      data-slot="tool-error"
      className="grid gap-0.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm"
    >
      <span className="font-medium text-destructive">{t(key)}</span>
      <span className="text-xs text-muted-foreground">{message}</span>
    </div>
  );
}
