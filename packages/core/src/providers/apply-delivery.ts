import { type Db, getDb } from "@bibi/db";
import { getLogger } from "@bibi/logger";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";
import { applyPaymentSignal } from "../features/payment/apply-signal-operation";
import { applyPaymentAccountSignal } from "../features/payment-account/apply-signal-operation";
import { execute } from "../operations/execute";
import type { ProviderKey } from "./provider-keys";
import { findProvider } from "./registry";
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

/** Runs one signal as SYSTEM in its organization; a payment never moves the order (ADR 0043). */
async function applySignal({ db, signal }: ApplyInput): Promise<Result<true>> {
  const organizationId = await organizationOf({ db, signal });
  if (!organizationId) {
    return err({ error: new AppError({ code: "NOT_FOUND", message: "No account" }) });
  }
  const context = providerSystemContext({ db, organizationId });
  if (signal.kind === "connection.status") {
    // Only a hosted payout account refreshes its status from an event (ADR 0028).
    if (findProvider({ key: signal.provider })?.connect.kind !== "HOSTED_ONBOARDING") {
      return ok({ value: true });
    }
    const input = { providerAccountId: signal.externalAccountId ?? "" };
    return done({
      result: await execute({ operation: applyPaymentAccountSignal, input, context }),
    });
  }
  if (signal.kind.startsWith("attempt.") || signal.kind.startsWith("refund.")) {
    return done({
      result: await execute({ operation: applyPaymentSignal, input: signal, context }),
    });
  }
  return ok({ value: true });
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
