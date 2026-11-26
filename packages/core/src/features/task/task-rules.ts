import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { checkReadable } from "../order/order-rules";

type Db = { context: Pick<OperationContext, "db"> };
type Access = { context: Pick<OperationContext, "permissions"> };

const READY = ok({ value: true as const });

/** The referenced ids' features, checked before any lookup so ids cannot be probed. */
export function checkTaskAccess({
  context,
  refs,
}: Access & { refs: Partial<Record<"customerId" | "contactId" | "items" | "orderId", unknown>> }) {
  const needs: Record<string, Permission> = {
    customerId: "customer:read",
    contactId: "customer:read",
    items: "item:read",
    orderId: "order:read",
  };
  for (const [path, value] of Object.entries(refs)) {
    const permission = needs[path];
    const empty = !value || (Array.isArray(value) && value.length === 0);
    if (empty || !permission) continue;
    const readable = checkReadable({ context, permission, path });
    if (!readable.ok) return readable;
  }
  return READY;
}

/** The task type: an active type of base `TASK` (ADR 0117). */
export async function loadTaskType({
  context,
  entityTypeId,
}: Db & { entityTypeId: string }): Promise<Result<{ id: string }>> {
  const type = await loadTypeOfBase({ context, entityTypeId, base: "TASK" });
  if (!type.ok) return type;
  return ok({ value: { id: type.value.id } });
}

export type TaskParty = {
  customerId: string | null;
  contactId: string | null;
  orderId: string | null;
};

/** A contact and an order need a customer (ADR 0120): without one, both stay empty. */
function partyNeedsCustomer({ customerId, contactId, orderId }: TaskParty): AppErrorIssue[] {
  if (customerId) return [];
  return [
    ...(contactId ? [{ path: "contactId", message: "A contact needs a customer" }] : []),
    ...(orderId ? [{ path: "orderId", message: "An order needs a customer" }] : []),
  ];
}

/** An active customer of the organization and, when given, an active contact person at it. */
export async function checkParty({ context, ...party }: Db & TaskParty): Promise<Result<true>> {
  const { customerId, contactId } = party;
  const needs = partyNeedsCustomer(party);
  if (needs.length > 0) return invalid({ message: needs[0]?.message ?? "Invalid", issues: needs });
  if (!customerId) return READY;
  const [customers, contacts] = await Promise.all([
    context.db.customer.count({ where: { id: customerId } }),
    contactId ? context.db.contact.count({ where: { id: contactId, customerId } }) : 1,
  ]);
  const issues: AppErrorIssue[] = [
    ...(customers === 0 ? [{ path: "customerId", message: "Unknown customer" }] : []),
    ...(contacts === 0
      ? [{ path: "contactId", message: "Not a contact person at the customer" }]
      : []),
  ];
  if (issues.length === 0) return READY;
  return invalid({ message: issues[0]?.message ?? "Invalid party", issues });
}

export type CheckTaskOrderInput = Db & {
  orderId: string | null;
  /** The customer the task will have; null = none (then there is no order, `checkParty`). */
  customerId: string | null;
  /** Skip the lookup when the order is the one it already has and the customer did not change. */
  changed: boolean;
};

/** A linked order is an active order of the task's own customer (`VALIDATION` at `orderId`). */
export async function checkTaskOrder({
  context,
  orderId,
  customerId,
  changed,
}: CheckTaskOrderInput) {
  if (!orderId) return READY;
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { customerId: true },
  });
  if (order && order.customerId === customerId) return READY;
  if (!order && !changed) return READY;
  const message = order ? "The order is for another customer" : "Unknown or archived order";
  return invalid({ message, issues: [{ path: "orderId", message }] });
}
