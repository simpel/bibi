import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput, OperationContext } from "../../operations/types";
import { nowOf } from "../../time/now";
import { isAmbiguous } from "../payment/refund-at-provider";
import {
  InvoiceRetryVoidsInputSchema,
  type InvoiceRetryVoidsOutput,
  InvoiceRetryVoidsOutputSchema,
} from "./schema";
import { callVoid } from "./void-at-provider";

/** A void left unconfirmed this long is tried again (the refund retry job's window). */
export const VOID_RETRY_AFTER_MS = 15 * 60_000;

type Context = Pick<OperationContext, "db" | "now">;

const dueVoids = ({ context }: { context: Context }) =>
  context.db.invoice.findMany({
    where: {
      status: "VOID",
      voidPendingAt: { lt: new Date(nowOf({ context }).getTime() - VOID_RETRY_AFTER_MS) },
    },
    select: { id: true },
    orderBy: [{ voidPendingAt: "asc" }, { id: "asc" }],
    take: 100,
  });

async function retryAfterCommit({
  output,
  context,
}: ExternalInput<unknown, InvoiceRetryVoidsOutput>): Promise<Result<InvoiceRetryVoidsOutput>> {
  const result = { ...output };
  for (const { id } of await dueVoids({ context })) {
    const done = await callVoid({ context, id });
    if (done.ok) result.voided++;
    else if (isAmbiguous({ error: done.error })) result.waiting++;
    else result.refused++;
  }
  return ok({ value: result });
}

/**
 * Finishes voids the provider left unanswered (ADR 0100): each VOID invoice with `voidPendingAt`
 * older than 15 minutes is voided at its provider again. Confirmed clears the flag; a definite
 * refusal makes it SENT again (`invoice.voidFailed`); no answer waits for the next run. Run with
 * the refund retry job; SYSTEM only, not registered on any surface.
 */
export const retryVoids = defineOperation({
  name: "invoice.retryVoids",
  kind: "command",
  description: "Retry voids the provider did not confirm (worker only).",
  input: InvoiceRetryVoidsInputSchema,
  output: InvoiceRetryVoidsOutputSchema,
  permission: "payment:write",
  entityType: "invoice",
  approval: false,
  aiAllowed: false,
  handler: async ({ context }) => {
    if (context.actor.type !== "system") {
      const message = "Unconfirmed voids are retried by the worker only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const due = (await dueVoids({ context })).length;
    return ok({ value: { due, voided: 0, refused: 0, waiting: 0 } });
  },
  external: retryAfterCommit,
});
