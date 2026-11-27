import type { ActionError } from "@/lib/action-result";

/** The `guestBooking.errors` keys a refused guest command maps to. */
export type GuestErrorKey = "taken" | "late" | "captcha" | "notFound";

/**
 * The guest's words for a refused booking command, or null for the generic error. Core answers
 * both a taken time and a passed cutoff with CONFLICT, told apart by the issue path
 * (`changeUntil` for a passed cutoff).
 */
export function guestErrorKey({ error }: { error: ActionError }): GuestErrorKey | null {
  if (error.issues.some((issue) => issue.path === "captcha")) return "captcha";
  if (error.code === "NOT_FOUND") return "notFound";
  if (error.code !== "CONFLICT") return null;
  return error.issues.some((issue) => issue.path === "changeUntil") ? "late" : "taken";
}
