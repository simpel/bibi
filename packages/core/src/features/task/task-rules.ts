import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { checkReadable } from "../order/order-rules";
import type { TaskShape } from "./task-shape";

type Db = { context: Pick<OperationContext, "db"> };
type Access = { context: Pick<OperationContext, "permissions"> };

const READY = ok({ value: true as const });

/** The referenced ids' features, checked before any lookup so ids cannot be probed. */
export function checkTaskAccess({
  context,
  refs,
}: Access & { refs: Partial<Record<"customerId" | "contactId" | "itemId" | "orderId", unknown>> }) {
  const needs: Record<string, Permission> = {
    customerId: "customer:read",
    contactId: "customer:read",
    itemId: "item:read",
    orderId: "order:read",
  };
  for (const [path, value] of Object.entries(refs)) {
    const permission = needs[path];
    if (!value || !permission) continue;
    const readable = checkReadable({ context, permission, path });
    if (!readable.ok) return readable;
  }
  return READY;
}

/** The task type: an active type of base `TASK`; its shape decides the times (ADR 0117). */
export async function loadTaskType({
  context,
  entityTypeId,
}: Db & { entityTypeId: string }): Promise<Result<{ id: string; shape: TaskShape }>> {
  const type = await loadTypeOfBase({ context, entityTypeId, base: "TASK" });
  if (!type.ok) return type;
  return ok({ value: { id: type.value.id, shape: type.value.taskShape ?? "MEETING" } });
}

export type CheckTimesInput = { shape: TaskShape; startsAt: Date; endsAt: Date | null };

/** A meeting needs an end after its start; a deadline has no end (`VALIDATION`). */
export function checkTimes({ shape, startsAt, endsAt }: CheckTimesInput): Result<true> {
  if (shape === "DEADLINE" && endsAt) {
    const message = "A deadline has one due time and no end";
    return invalid({ message, issues: [{ path: "endsAt", message }] });
  }
  if (shape === "MEETING" && (!endsAt || endsAt <= startsAt)) {
    const message = "A meeting needs an end after its start";
    return invalid({ message, issues: [{ path: "endsAt", message }] });
  }
  return READY;
}

export type CheckPartyInput = Db & { customerId: string; contactId: string };

/** An active customer of the organization and an active contact person at it. */
export async function checkParty({ context, customerId, contactId }: CheckPartyInput) {
  const [customers, contacts] = await Promise.all([
    context.db.customer.count({ where: { id: customerId } }),
    context.db.contact.count({ where: { id: contactId, customerId } }),
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

/** A named item is an active item of the organization. */
export async function checkTaskItem({
  context,
  itemId,
}: Db & { itemId: string | null | undefined }) {
  if (!itemId) return READY;
  const found = await context.db.item.count({ where: { id: itemId } });
  if (found > 0) return READY;
  const message = "Unknown item";
  return invalid({ message, issues: [{ path: "itemId", message }] });
}
