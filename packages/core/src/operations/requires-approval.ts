import type { Actor, AnyOperation } from "./types";

export type RequiresApprovalInput = { operation: AnyOperation; actor: Actor };

/** True when an AI-proposed call must be confirmed by a human before `execute`. */
export function requiresApproval({ operation, actor }: RequiresApprovalInput): boolean {
  return actor.type === "ai" && operation.kind === "command" && operation.approval;
}
