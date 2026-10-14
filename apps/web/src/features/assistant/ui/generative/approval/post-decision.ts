import { z } from "zod";

const ResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("approved"), result: z.unknown() }),
  z.object({ status: z.literal("rejected") }),
]);

export type Decision = "approve" | "reject";

export type PostDecisionInput = {
  decision: Decision;
  approvalToken: string;
  operation: string;
  conversationId: string | null;
  toolCallId: string | undefined;
};

export type DecisionOutcome =
  | { ok: true; status: "approved"; result: unknown }
  | { ok: true; status: "rejected" }
  /** `status` = HTTP status, or `null` when the request never reached the server. */
  | { ok: false; status: number | null };

/** POST the user's click to `/api/assistant/approval` and parse the answer (Zod at the boundary). */
export async function postDecision({
  decision,
  approvalToken,
  operation,
  conversationId,
  toolCallId,
}: PostDecisionInput): Promise<DecisionOutcome> {
  try {
    const response = await fetch("/api/assistant/approval", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        decision,
        approvalToken,
        operation,
        ...(conversationId ? { conversationId } : {}),
        ...(toolCallId ? { toolCallId } : {}),
      }),
    });
    if (!response.ok) return { ok: false, status: response.status };
    const parsed = ResponseSchema.safeParse(await response.json());
    return parsed.success ? { ok: true, ...parsed.data } : { ok: false, status: 502 };
  } catch {
    return { ok: false, status: null };
  }
}
