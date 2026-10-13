import "server-only";
import type { AppError } from "@okazi/core";
import { redirect } from "@okazi/i18n/navigation";
import { notFound } from "next/navigation";
import { type ErrorKey, errorKeyForCode } from "@/lib/error-key";
import { ROUTES } from "@/lib/routes";

export type HandleLoadErrorInput = { error: AppError; locale: string };

/**
 * Server-component handling of a failed `runOperation`: expired session → login, missing
 * entity → 404 page; anything else is returned as an `errors.*` key for an inline error state.
 */
export function handleLoadError({ error, locale }: HandleLoadErrorInput): ErrorKey {
  if (error.code === "UNAUTHENTICATED") redirect({ href: ROUTES.login, locale });
  if (error.code === "NOT_FOUND") notFound();
  return errorKeyForCode({ code: error.code });
}
