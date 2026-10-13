import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { Actor } from "../../operations/types";

export type CheckAppendActorInput = { actor: Actor; role: string; conversationId: string };

const AI_ROLES = new Set(["ASSISTANT", "TOOL"]);

/**
 * The assistant (AI actor) may only append ASSISTANT/TOOL messages, and only to the conversation
 * it runs in, so a prompt-injected model cannot forge user or system turns. USER/SYSTEM messages
 * are persisted by the app as the user.
 */
export function checkAppendActor({
  actor,
  role,
  conversationId,
}: CheckAppendActorInput): Result<true> {
  if (actor.type !== "ai") return ok({ value: true });
  if (!AI_ROLES.has(role)) {
    const message = "The assistant can only append ASSISTANT or TOOL messages";
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  if (actor.conversationId && actor.conversationId !== conversationId) {
    const message = "The assistant can only append to its own conversation";
    return err({ error: new AppError({ code: "FORBIDDEN", message }) });
  }
  return ok({ value: true });
}
