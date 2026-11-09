import { type Db, getDb } from "@bibi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { createExecuteContext } from "../../operations/context";
import { defineOperation } from "../../operations/define-operation";
import { execute } from "../../operations/execute";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { startAtProvider } from "./charge-after-commit";
import {
  type PaymentAttemptDto,
  PaymentAttemptSchema,
  type PaymentStartAttemptInput,
  PaymentStartAttemptInputSchema,
} from "./lifecycle-schema";
import { routedMethods } from "./payment-preconditions";
import { PublicTokenSchema } from "./public-token";
import { PAYMENT_INCLUDE } from "./to-payment-dto";

type Attempt = Omit<PaymentAttemptDto, "method"> & { method: string };

const toAttemptDto = ({ row }: { row: Attempt }): PaymentAttemptDto => {
  const { id, provider, status, url, qrToken, expiresAt } = row;
  const method = row.method === "SWISH" ? "SWISH" : "CARD";
  return { id, method, provider, status, url, qrToken, expiresAt };
};

type HandlerInput = { context: OperationContext; input: PaymentStartAttemptInput };

/** Reuses a still valid open attempt for the method, else writes a new one to start after commit. */
async function openAttempt({ context, input }: HandlerInput): Promise<Result<PaymentAttemptDto>> {
  const payment = await context.db.payment.findFirst({ where: { publicToken: input.token } });
  if (!payment) return notFound({ entity: "Payment" });
  if (payment.status !== "PENDING")
    return conflict({ message: `The payment is ${payment.status}` });
  const routes = await routedMethods({ context });
  if (!routes.ok) return routes;
  const route = routes.value.find((r) => r.method === input.method)?.route;
  if (!route) return conflict({ message: `${input.method} is not available for this payment` });
  const now = nowOf({ context });
  const valid = await context.db.paymentAttempt.findFirst({
    where: {
      paymentId: payment.id,
      method: input.method,
      provider: route.provider,
      status: "PENDING",
      providerReference: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  if (valid) return ok({ value: toAttemptDto({ row: valid }) });
  const row = await context.db.paymentAttempt.create({
    data: {
      organizationId: context.organizationId,
      paymentId: payment.id,
      method: input.method,
      provider: route.provider,
      connectionId: route.connection.id,
      createdBy: context.actor.userId,
    },
  });
  return ok({ value: toAttemptDto({ row }) });
}

type ExternalArgs = HandlerInput & { output: PaymentAttemptDto };

/** Starts the new attempt at the provider (ADR 0058); a refusal leaves the attempt FAILED. */
async function startNew({
  context,
  input,
  output,
}: ExternalArgs): Promise<Result<PaymentAttemptDto>> {
  const attempt = await context.db.paymentAttempt.findFirst({ where: { id: output.id } });
  if (!attempt) return notFound({ entity: "Payment attempt" });
  if (attempt.providerReference) return ok({ value: output });
  const row = await context.db.payment.findFirst({
    where: { id: attempt.paymentId },
    include: PAYMENT_INCLUDE,
  });
  if (!row) return notFound({ entity: "Payment" });
  const started = await startAtProvider({
    context,
    row,
    method: input.method,
    connectionId: attempt.connectionId,
    description: undefined,
    idempotencyKey: `bibi-attempt-${attempt.id}`,
  });
  if (!started.ok) {
    await context.db.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: "FAILED" },
    });
    return err({ error: started.error });
  }
  const { providerReference, url, qrToken, expiresAt } = started.value;
  const updated = await context.db.paymentAttempt.update({
    where: { id: attempt.id },
    data: { providerReference, url, qrToken, expiresAt },
  });
  return ok({ value: toAttemptDto({ row: updated }) });
}

/**
 * Starts paying a payment with the method the customer chose on the public page `/pay/<token>`
 * (ADR 0100): the method's routed provider, an attempt that is still valid reused, else a new
 * one. SYSTEM only, run by `startPublicAttempt` after the token pinned the organization; not part
 * of `createCoreOperations`, so it has no adapters (like `payment.getPublic`).
 */
export const startPaymentAttempt = defineOperation({
  name: "payment.startAttempt",
  kind: "command",
  description: "Start paying a payment by its public token with the method the customer chose.",
  input: PaymentStartAttemptInputSchema,
  output: PaymentAttemptSchema,
  permission: "payment:write",
  approval: false,
  aiAllowed: false,
  entityType: "payment",
  handler: async ({ input, context }) => {
    if (context.actor.type !== "system") {
      const message = "Attempts start from the public payment page only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    return openAttempt({ context, input });
  },
  external: ({ input, output, context }) => startNew({ context, input, output }),
});

export type StartPublicAttemptInput = PaymentStartAttemptInput & { db?: Db };

/**
 * The public page's call: the token pins the organization (the one cross-organization lookup,
 * ADR 0004), then `payment.startAttempt` runs as SYSTEM in it. Any bad token is `NOT_FOUND`.
 */
export async function startPublicAttempt({
  token,
  method,
  db = getDb(),
}: StartPublicAttemptInput): Promise<Result<PaymentAttemptDto>> {
  if (!PublicTokenSchema.safeParse(token).success) return notFound({ entity: "Payment" });
  const row = await db.payment.findUnique({
    where: { publicToken: token },
    select: { organizationId: true },
  });
  if (!row) return notFound({ entity: "Payment" });
  const context = createExecuteContext({
    organizationId: row.organizationId,
    roles: [],
    permissions: { payment: ["read", "write"] },
    actor: { type: "system", userId: null },
    db,
  });
  return execute({ operation: startPaymentAttempt, input: { token, method }, context });
}
