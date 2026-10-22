import "server-only";
import type { AppError } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { redirect } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type HandleLoadErrorInput = { error: AppError; locale: Locale };

/**
 * Server-component handling of a failed `runOperation`: expired session → login, missing
 * entity → 404 page; anything else is returned as an `errors.*` key for an inline error state.
 */
export function handleLoadError({ error, locale }: HandleLoadErrorInput): ErrorKey {
  if (error.code === "UNAUTHENTICATED") redirect({ href: ROUTES.login, locale });
  if (error.code === "NOT_FOUND") notFound();
  return errorKeyForCode({ code: error.code });
}
