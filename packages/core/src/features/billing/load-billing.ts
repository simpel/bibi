import { getDb } from "@bibi/db";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { deriveAccess } from "./access";
import { getBillingGateway } from "./gateway-registry";
import { effectiveTrialEnd } from "./plan";
import type { BillingAccessDto } from "./schema";

type Context = { context: Pick<OperationContext, "db" | "organizationId"> };

/** The organization's billing row, or null before its first change. */
export function loadBillingRow({ context }: Context) {
  return context.db.billingAccount.findFirst({});
}
export type BillingRow = NonNullable<Awaited<ReturnType<typeof loadBillingRow>>>;

/** When the organization was created: the trial starts there (read outside the scoped client). */
async function organizationCreatedAt({ organizationId }: { organizationId: string }) {
  const row = await getDb().organization.findUnique({
    where: { id: organizationId },
    select: { createdAt: true },
  });
  return row?.createdAt ?? new Date();
}

export type LoadAccessInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "permissions">;
  row: BillingRow | null;
  now?: Date;
};

/** The access state on read (ADR 0095 §5); nothing about it is stored. */
export async function loadAccess({
  context,
  row,
  now = new Date(),
}: LoadAccessInput): Promise<BillingAccessDto> {
  const [createdAt, configured] = await Promise.all([
    organizationCreatedAt({ organizationId: context.organizationId }),
    getBillingGateway().isConfigured(),
  ]);
  const trialEndsAt = effectiveTrialEnd({
    organizationCreatedAt: createdAt,
    trialEndsAt: row?.trialEndsAt ?? null,
  });
  const state = deriveAccess({
    exempt: row?.exempt ?? false,
    subscriptionStatus: row?.subscriptionStatus ?? null,
    ...{ trialEndsAt, configured, now },
  });
  const canPay = hasPermission({ permissions: context.permissions, permission: "billing:write" });
  return { state, open: state !== "REQUIRED", trialEndsAt, canPay };
}
