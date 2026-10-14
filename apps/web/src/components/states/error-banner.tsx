"use client";

import { useTranslations } from "next-intl";
import type { AuthErrorKey } from "@/lib/auth-error-key";

export type ErrorBannerProps = { errorKey: AuthErrorKey | null };

/** Inline, localized error message (role=alert) for form and action failures. */
export function ErrorBanner({ errorKey }: ErrorBannerProps) {
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
