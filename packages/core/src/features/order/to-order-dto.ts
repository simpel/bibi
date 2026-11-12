import { getEnv } from "@bibi/config";
import type { BuyerKind, Order } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import {
  RECORD_LINKS_SELECT,
  recordFields,
  type WithRecordLinks,
} from "../../records/record-links";
import { orderReplyAddress } from "../inbound-email/address";
import { LATEST_ESTIMATE, type LatestEstimate } from "./estimate-history";
import type { OrderDto } from "./schema";
import { LATEST_STATUS_CHANGE, type LatestStatusChange } from "./status-history";

type MainAssignment = { record: { assignments: { assigneeId: string | null }[] } };

/** The customer's buyer kind, which the order inherits when it sets none (ADR 0106). */
type CustomerKind = { customer: { buyerKind: BuyerKind } };

/** The contact's buyer's reference, which the order inherits when it sets none (ADR 0105). */
type ContactReference = { contact: { buyerReference: string | null } | null };

export type OrderRow = Order &
  WithRecordLinks &
  MainAssignment &
  CustomerKind &
  ContactReference &
  LatestStatusChange &
  LatestEstimate;

export type ToOrderDtoInput = { row: OrderRow };

/** The record's main assignment (responsibility null), for `assigneeId` (ADR 0055). */
const MAIN_ASSIGNMENT = {
  where: { responsibilityId: null, status: "ACTIVE" },
  select: { assigneeId: true },
  take: 1,
} as const;

/**
 * Prisma `include` for every order read (`toOrderDto`): its `LINK` values and main assignee, its
 * newest status change (ADR 0054) and its newest estimate (ADR 0074).
 */
export const ORDER_INCLUDE = {
  record: { select: { ...RECORD_LINKS_SELECT, assignments: MAIN_ASSIGNMENT } },
  customer: { select: { buyerKind: true } },
  contact: { select: { buyerReference: true } },
  ...LATEST_STATUS_CHANGE,
  ...LATEST_ESTIMATE,
};

type EffectiveReferenceInput = { order: string | null; contact: string | null };

/** The order's own buyer's reference, else its contact's, and where it came from (ADR 0105). */
export function effectiveReference({ order, contact }: EffectiveReferenceInput) {
  if (order) return { effectiveBuyerReference: order, buyerReferenceSource: "ORDER" as const };
  if (contact) return { effectiveBuyerReference: contact, buyerReferenceSource: "CONTACT" as const };
  return { effectiveBuyerReference: null, buyerReferenceSource: null };
}

export const toOrderDto = ({ row }: ToOrderDtoInput): OrderDto => {
  const { record: _record, customer, contact, statusChanges, estimates, ...order } = row;
  const domain = getEnv().MAIL_INBOUND_DOMAIN;
  const inboundAddress = orderReplyAddress({ orderId: row.id, domain });
  const latest = statusChanges[0];
  return {
    ...order,
    assigneeId: row.record.assignments[0]?.assigneeId ?? null,
    effectiveBuyerKind: row.buyerKind ?? customer.buyerKind,
    ...effectiveReference({ order: row.buyerReference, contact: contact?.buyerReference ?? null }),
    statusChangedAt: latest?.changedAt ?? row.createdAt,
    statusReason: latest?.reason ?? null,
    estimatedValueMinor: estimates[0]?.valueMinor ?? null,
    fields: recordFields({ row }),
    inboundAddress,
  };
};

export type LoadOrderInput = { context: Pick<OperationContext, "db">; id: string };

/** The active order, or null when missing, archived or in another organization. */
export async function loadOrder({ context, id }: LoadOrderInput): Promise<OrderDto | null> {
  const row = await context.db.order.findFirst({ where: { id }, include: ORDER_INCLUDE });
  return row ? toOrderDto({ row }) : null;
}
