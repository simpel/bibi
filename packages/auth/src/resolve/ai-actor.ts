import { type Actor, ok, type Result } from "@bibi/core";
import { z } from "zod";
import { forbidden } from "./errors";

export const ACTOR_HEADER = "x-bibi-actor";
export const CONVERSATION_HEADER = "x-bibi-conversation-id";

const AiRequestSchema = z.object({
  actor: z.literal("ai"),
  conversationId: z.string().trim().min(1).max(200),
});

export type BuildActorInput = {
  headers: Headers;
  userId: string | null;
  /** Set for API key requests (ADR 0050). */
  apiKeyId?: string | undefined;
  /** True only for OAuth tokens of a first-party client with `allowsAiActor` (the assistant). */
  aiAllowed: boolean;
};

/**
 * `apiKey` actor for API key requests (ADR 0050), else `user` by default. `x-bibi-actor: ai` (+ conversation id) yields an `ai` actor acting
 * for `userId`, which makes commands require human approval. An AI request we cannot honour is
 * rejected, never silently downgraded to `user` (that would skip the approval step).
 */
export function buildActor({
  headers,
  userId,
  apiKeyId,
  aiAllowed,
}: BuildActorInput): Result<Actor> {
  const requested = headers.get(ACTOR_HEADER);
  if (apiKeyId) {
    if (requested !== null && requested !== "user") {
      return forbidden({ message: "AI actor is only accepted from the Bibi web app" });
    }
    return ok({ value: { type: "apiKey", userId: null, apiKeyId } });
  }
  if (!userId) return forbidden({ message: "No user" });
  if (requested === null || requested === "user") return ok({ value: { type: "user", userId } });
  const parsed = AiRequestSchema.safeParse({
    actor: requested,
    conversationId: headers.get(CONVERSATION_HEADER) ?? "",
  });
  if (!parsed.success) {
    return forbidden({ message: `${ACTOR_HEADER} must be "ai" with ${CONVERSATION_HEADER}` });
  }
  if (!aiAllowed) return forbidden({ message: "AI actor is only accepted from the Bibi web app" });
  const { conversationId } = parsed.data;
  return ok({ value: { type: "ai", userId, conversationId } });
}
