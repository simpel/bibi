import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { parseMemberRole } from "../member/member-roles";
import { loadAccess, loadBillingRow } from "./load-billing";
import {
  BillingAccessSchema,
  BillingGetInputSchema,
  BillingSchema,
  SeatRequestListSchema,
} from "./schema";
import { loadBillingDto } from "./to-billing-dto";

export const getBilling = defineOperation({
  name: "billing.get",
  kind: "query",
  entityType: "billingAccount",
  description:
    "The organization's subscription to Bibi: trial end, access state, plan interval, Stripe " +
    "status, seats (10 included, extra paid, used, held for approval) and the prices.",
  input: BillingGetInputSchema,
  output: BillingSchema,
  permission: "billing:read",
  handler: async ({ context }) => ok({ value: await loadBillingDto({ context }) }),
});

export const getBillingAccess = defineOperation({
  name: "billing.access",
  kind: "query",
  entityType: "billingAccount",
  description:
    "Whether the organization may use Bibi right now (trial, paid, exempt) or must pay first, " +
    "and whether the caller can pay. Every member may ask.",
  input: BillingGetInputSchema,
  output: BillingAccessSchema,
  permission: "self:read",
  handler: async ({ context }) => {
    const row = await loadBillingRow({ context });
    return ok({ value: await loadAccess({ context, row }) });
  },
});

export const listSeatRequests = defineOperation({
  name: "billing.listSeatRequests",
  kind: "query",
  entityType: "billingAccount",
  description:
    "Invitations held because every seat is taken and auto-assign is off; approve each with " +
    "billing.approveSeat (adds a paid seat) or refuse it with billing.rejectSeat.",
  input: BillingGetInputSchema,
  output: SeatRequestListSchema,
  permission: "billing:read",
  handler: async ({ context }) => {
    const rows = await context.db.invitation.findMany({
      where: { status: "held", expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, inviterId: true, createdAt: true },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: 200,
    });
    const items = rows.map((row) => ({
      ...row,
      organizationId: context.organizationId,
      role: parseMemberRole({ role: row.role }),
    }));
    return ok({ value: { items } });
  },
});
