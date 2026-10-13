import { type Actor, ok, type Result } from "@okazi/core";
import { z } from "zod";
import { forbidden } from "./errors";

export const ACTOR_HEADER = "x-okazi-actor";
export const CONVERSATION_HEADER = "x-okazi-conversation-id";

const AiRequestSchema = z.object({
  actor: z.literal("ai"),
  conversationId: z.string().trim().min(1).max(200),
});

export type BuildActorInput = {
  headers: Headers;
  userId: string;
  /** True only for OAuth tokens of a first-party client with `allowsAiActor` (the assistant). */
  aiAllowed: boolean;
};

/**
 * `user` actor by default. `x-okazi-actor: ai` (+ conversation id) yields an `ai` actor acting
 * for `userId`, which makes commands require human approval. An AI request we cannot honour is
 * rejected, never silently downgraded to `user` (that would skip the approval step).
 */
export function buildActor({ headers, userId, aiAllowed }: BuildActorInput): Result<Actor> {
  const requested = headers.get(ACTOR_HEADER);
  if (requested === null || requested === "user") return ok({ value: { type: "user", userId } });
  const parsed = AiRequestSchema.safeParse({
    actor: requested,
    conversationId: headers.get(CONVERSATION_HEADER) ?? "",
  });
  if (!parsed.success) {
    return forbidden({ message: `${ACTOR_HEADER} must be "ai" with ${CONVERSATION_HEADER}` });
  }
  if (!aiAllowed) return forbidden({ message: "AI actor is only accepted from the Okazi web app" });
  const { conversationId } = parsed.data;
  return ok({ value: { type: "ai", userId, conversationId } });
}
