import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { afterEach, beforeEach } from "vitest";
import {
  createMemoryBillingGateway,
  type ExecuteContext,
  type MemoryBillingGateway,
  setBillingGateway,
} from "../src/index";

/** Installs a fresh memory billing gateway per test and restores Stripe afterwards. */
export function useMemoryBilling(): { gateway: () => MemoryBillingGateway } {
  let current = createMemoryBillingGateway();
  beforeEach(() => {
    current = createMemoryBillingGateway();
    setBillingGateway({ gateway: current });
  });
  afterEach(() => setBillingGateway({ gateway: undefined }));
  return { gateway: () => current };
}

export type FillSeatsInput = { context: ExecuteContext; count: number };

/** Takes `count` seats with pending invitations written straight to the table. */
export async function fillSeats({ context, count }: FillSeatsInput): Promise<void> {
  const inviterId = context.actor.userId ?? "";
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await getDb().invitation.createMany({
    data: Array.from({ length: count }, () => ({
      id: createId(),
      organizationId: context.organizationId,
      email: `${createId()}@example.test`,
      role: "member",
      status: "pending",
      inviterId,
      expiresAt,
      createdAt: new Date(),
    })),
  });
}

export type SetBillingRowInput = {
  context: ExecuteContext;
  data: { trialEndsAt?: Date; autoAssignSeats?: boolean; exempt?: boolean; extraSeats?: number };
};

/** Writes the billing row directly (what a superadmin or a past change left). */
export async function setBillingRow({ context, data }: SetBillingRowInput) {
  const { organizationId } = context;
  await getDb().billingAccount.upsert({
    where: { organizationId },
    create: { organizationId, ...data },
    update: data,
  });
}
