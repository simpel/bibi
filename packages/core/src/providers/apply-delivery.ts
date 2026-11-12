import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import { applyIntegrationSignal } from "../features/integration/apply-signal-operation";
import { applyInvoiceSignal } from "../features/invoice/apply-signal-operation";
import { applyPaymentSignal } from "../features/payment/apply-signal-operation";
import type { ExecuteContext } from "../operations/context";
import { execute } from "../operations/execute";
import type { ProviderKey } from "./provider-keys";
import type { ProviderSignal } from "./signal";
import { providerSystemContext } from "./system-context";
import type { VerifiedDelivery } from "./types";

export type DeliveryStatus = "applied" | "duplicate" | "ignored" | "unmatched";

type ApplyInput = { db: Db; signal: ProviderSignal };

/**
 * The one cross-organization lookup of the flow (ADR 0004): which organization owns the account the
 * event happened on. It only reads the id that then pins every later step.
 */
async function organizationOf({ db, signal }: ApplyInput): Promise<string | null> {
  if (!signal.externalAccountId) return null;
  const row = await db.providerConnection.findFirst({
    where: { provider: signal.provider, externalAccountId: signal.externalAccountId },
    select: { organizationId: true },
  });
  return row?.organizationId ?? null;
}

const done = ({ result }: { result: Result<unknown> }): Result<true> =>
  result.ok ? ok({ value: true }) : err({ error: result.error });

/** An attempt signal a provider sends for an invoice no longer raised through the port. */
const AS_ATTEMPT = {
  "invoice.payment_recorded": "attempt.succeeded",
  "invoice.voided": "attempt.cancelled",
} as const;

type InOrganization = { context: ExecuteContext; signal: ProviderSignal };

/**
 * An `invoice.*` signal: the invoice the provider raised on that account, by its document id. A
 * provider id Bibi knows only from an attempt (a one-line invoice from before ADR 0100) is applied
 * to that payment instead.
 */
async function applyToInvoice({ context, signal }: InOrganization): Promise<Result<true>> {
  const connection = await context.db.providerConnection.findFirst({
    where: { provider: signal.provider, externalAccountId: signal.externalAccountId ?? "" },
    select: { id: true },
  });
  const invoice =
    connection && signal.documentReference
      ? await context.db.invoice.findFirst({
          where: { connectionId: connection.id, providerReference: signal.documentReference },
          select: { id: true },
        })
      : null;
  if (invoice) {
    const input = { invoiceId: invoice.id, signal };
    return done({ result: await execute({ operation: applyInvoiceSignal, input, context }) });
  }
  // Or a deposit's prepayment invoice there (ADR 0106).
  const deposit =
    connection && signal.documentReference
      ? await context.db.deposit.findFirst({
          where: { connectionId: connection.id, providerReference: signal.documentReference },
          select: { id: true },
        })
      : null;
  if (deposit) {
    const input = { depositId: deposit.id, signal };
    return done({ result: await execute({ operation: applyInvoiceSignal, input, context }) });
  }
  const kind = AS_ATTEMPT[signal.kind as keyof typeof AS_ATTEMPT];
  if (!kind) return ok({ value: true });
  const input = { ...signal, kind };
  return done({ result: await execute({ operation: applyPaymentSignal, input, context }) });
}

/** Runs one signal as SYSTEM in its organization; a payment never moves the order (ADR 0043). */
async function applySignal({ db, signal }: ApplyInput): Promise<Result<true>> {
  const organizationId = await organizationOf({ db, signal });
  if (!organizationId) {
    return err({ error: new AppError({ code: "NOT_FOUND", message: "No account" }) });
  }
  const context = providerSystemContext({ db, organizationId });
  if (signal.kind === "connection.status") {
    const input = { provider: signal.provider, externalAccountId: signal.externalAccountId ?? "" };
    return done({ result: await execute({ operation: applyIntegrationSignal, input, context }) });
  }
  if (signal.kind.startsWith("invoice.")) return applyToInvoice({ context, signal });
  return done({
    result: await execute({ operation: applyPaymentSignal, input: signal, context }),
  });
}
type ClaimInput = { db: Db; provider: ProviderKey; delivery: VerifiedDelivery };

async function claim({ db, provider, delivery }: ClaimInput): Promise<boolean> {
  const data = [{ provider, eventId: delivery.eventId, type: delivery.type }];
  const { count } = await db.providerEventReceipt.createMany({ data, skipDuplicates: true });
  return count === 1;
}

async function applyAll({ db, delivery }: { db: Db; delivery: VerifiedDelivery }) {
  for (const signal of delivery.signals) {
    const applied = await applySignal({ db, signal });
    if (!applied.ok) return applied;
  }
  return ok({ value: true as const });
}

export type ApplyDeliveryInput = { provider: ProviderKey; delivery: VerifiedDelivery; db?: Db };

/**
 * Applies one verified provider delivery (ADR 0028, 0100), as SYSTEM in the organization that owns
 * the account. Deduplicated on `(provider, eventId)` in `ProviderEventReceipt`: a redelivery changes
 * nothing. Events Bibi does not act on, and events for unknown accounts or payments, are
 * acknowledged so the provider stops retrying. A failure releases the receipt so a retry runs.
 */
export async function applyProviderDelivery({
  provider,
  delivery,
  db = getDb(),
}: ApplyDeliveryInput): Promise<Result<{ status: DeliveryStatus }>> {
  const fields = { provider, eventId: delivery.eventId, type: delivery.type };
  if (delivery.signals.length === 0) {
    getLogger().info({ event: "provider.webhook.ignored", ...fields });
    return ok({ value: { status: "ignored" } });
  }
  if (!(await claim({ db, provider, delivery }))) {
    getLogger().info({ event: "provider.webhook.duplicate", ...fields });
    return ok({ value: { status: "duplicate" } });
  }
  const applied = await applyAll({ db, delivery }).catch((error: unknown) => {
    getLogger().error({ event: "provider.webhook.failed", ...fields, err: error });
    return err({ error: new AppError({ code: "INTERNAL", message: "Webhook failed" }) });
  });
  if (applied.ok) {
    getLogger().info({ event: "provider.webhook.applied", ...fields });
    return ok({ value: { status: "applied" } });
  }
  if (applied.error.code === "NOT_FOUND") {
    getLogger().warn({ event: "provider.webhook.unmatched", ...fields });
    return ok({ value: { status: "unmatched" } });
  }
  await db.providerEventReceipt.deleteMany({ where: { provider, eventId: delivery.eventId } });
  return err({ error: applied.error });
}
