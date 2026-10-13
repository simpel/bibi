import type { ErrorKey } from "@/lib/error-key";

/** `errors.*` keys for a failed decision (two of them are approval specific). */
export type ApprovalErrorKey = "approvalUsed" | "approvalExpired" | ErrorKey;

export type ApprovalErrorKeyInput = { status: number | null };

/**
 * Approval endpoint status → message: 409 = the proposal was already used, 403 = invalid,
 * expired or someone else's, 401 = signed out, null = the request never reached the server.
 */
export function approvalErrorKey({ status }: ApprovalErrorKeyInput): ApprovalErrorKey {
  if (status === null) return "network";
  if (status === 409) return "approvalUsed";
  if (status === 403) return "approvalExpired";
  if (status === 401) return "unauthorized";
  if (status === 404) return "notFound";
  return "generic";
}
