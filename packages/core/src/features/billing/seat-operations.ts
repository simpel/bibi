import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { notFound } from "../../shared/errors";
import { InvitationSchema } from "../member/schema";
import { INVITATION_SELECT, toInvitationDto } from "../member/to-invitation-dto";
import { SeatRequestIdInputSchema } from "./schema";
import { seatCapacity, seatUsage } from "./seats";
import { syncSeats } from "./sync-seats";

type Context = OperationContext;

async function heldInvitation({ context, id }: { context: Context; id: string }) {
  return context.db.invitation.findFirst({
    where: { id, status: "held", expiresAt: { gt: new Date() } },
    select: INVITATION_SELECT,
  });
}

type DecideInput = { context: Context; id: string; status: "pending" | "canceled" };

/** Moves the invitation out of `held` once; false when another decision came first. */
async function decide({ context, id, status }: DecideInput): Promise<boolean> {
  const { count } = await context.db.invitation.updateMany({
    where: { id, status: "held" },
    data: { status },
  });
  return count === 1;
}

/**
 * Adds a paid seat when the approved invitation does not fit (ADR 0095 §6). The row lock comes
 * before the count, so concurrent approvals and invitations are counted one after the other.
 */
async function addSeatIfFull({ context }: { context: Context }) {
  const row = await context.db.billingAccount.upsert({
    where: { organizationId: context.organizationId },
    create: { organizationId: context.organizationId },
    update: { updatedAt: new Date() },
  });
  // `used` already counts the approved invitation, now pending.
  const { used } = await seatUsage({ context });
  if (used <= seatCapacity({ extraSeats: row.extraSeats })) return;
  const after = await context.db.billingAccount.update({
    where: { id: row.id },
    data: { extraSeats: { increment: 1 } },
  });
  context.recordChange({ entityType: "billingAccount", entityId: row.id, before: row, after });
}

export const approveSeat = defineOperation({
  name: "billing.approveSeat",
  kind: "command",
  entityType: "billingAccount",
  description:
    "Approve a held invitation (from billing.listSeatRequests): adds a paid seat (49 SEK a " +
    "month) when every seat is taken, and sends the invitation.",
  input: SeatRequestIdInputSchema,
  output: InvitationSchema,
  permission: "billing:write",
  handler: async ({ input, context }) => {
    const before = await heldInvitation({ context, id: input.id });
    if (!before || !(await decide({ context, id: input.id, status: "pending" }))) {
      return notFound({ entity: "Held invitation" });
    }
    await addSeatIfFull({ context });
    const row = await context.db.invitation.findFirstOrThrow({
      where: { id: input.id },
      select: INVITATION_SELECT,
    });
    const invitation = toInvitationDto({ row });
    context.recordChange({
      entityType: "invitation",
      entityId: row.id,
      before: toInvitationDto({ row: before }),
      after: invitation,
    });
    return ok({ value: invitation });
  },
  followUp: ({ context }) => syncSeats({ context }),
});

export const rejectSeat = defineOperation({
  name: "billing.rejectSeat",
  kind: "command",
  entityType: "billingAccount",
  description: "Refuse a held invitation (from billing.listSeatRequests); it is canceled.",
  input: SeatRequestIdInputSchema,
  output: InvitationSchema,
  permission: "billing:write",
  handler: async ({ input, context }) => {
    const before = await heldInvitation({ context, id: input.id });
    if (!before || !(await decide({ context, id: input.id, status: "canceled" }))) {
      return notFound({ entity: "Held invitation" });
    }
    const row = await context.db.invitation.findFirstOrThrow({
      where: { id: input.id },
      select: INVITATION_SELECT,
    });
    const invitation = toInvitationDto({ row });
    context.recordChange({
      entityType: "invitation",
      entityId: row.id,
      before: toInvitationDto({ row: before }),
      after: invitation,
    });
    return ok({ value: invitation });
  },
});
