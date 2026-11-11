import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkPeopleLimit } from "../line/people-limit";
import { checkContact, checkCustomer, checkDesiredPeriod, checkReadable } from "./order-rules";
import type { OrderDto, OrderUpdateInput } from "./schema";

export type CheckOrderDetailsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  before: OrderDto;
  change: Omit<OrderUpdateInput, "id" | "fields">;
};

/** The given value, or the stored one when the update omits it (null clears). */
const pick = <T>({ given, stored }: { given: T | undefined; stored: T }): T =>
  given === undefined ? stored : given;

/** The details after a `order.update` must still hold together: dates, customer and contact. */
export async function checkOrderDetails({
  context,
  before,
  change,
}: CheckOrderDetailsInput): Promise<Result<true>> {
  const period = checkDesiredPeriod({
    desiredStartsAt: pick({ given: change.desiredStartsAt, stored: before.desiredStartsAt }),
    desiredEndsAt: pick({ given: change.desiredEndsAt, stored: before.desiredEndsAt }),
  });
  if (!period.ok) return period;
  const customerId = change.customerId ?? before.customerId;
  if (customerId !== before.customerId) {
    const readable = checkReadable({ context, permission: "customer:read", path: "customerId" });
    if (!readable.ok) return readable;
    const customer = await checkCustomer({ context, customerId });
    if (!customer.ok) return customer;
  }
  const contactId = pick({ given: change.contactId, stored: before.contactId });
  // An unchanged reference stays valid even if the contact was archived since.
  if (contactId === before.contactId && customerId === before.customerId) {
    return ok({ value: true });
  }
  if (contactId) {
    const readable = checkReadable({ context, permission: "customer:read", path: "contactId" });
    if (!readable.ok) return readable;
  }
  const contact = await checkContact({ context, contactId, customerId });
  return contact.ok ? ok({ value: true }) : contact;
}

/**
 * ADR 0103 decision 4: a headcount change may not put a line that counts it above its item's
 * people limit. `VALIDATION` on the headcount field in effect after the change.
 */
export async function checkHeadcountChange({
  context,
  before,
  change,
}: CheckOrderDetailsInput): Promise<Result<true>> {
  const { estimatedHeadcount, guaranteedHeadcount } = change;
  if (estimatedHeadcount === undefined && guaranteedHeadcount === undefined) {
    return ok({ value: true });
  }
  const value = {
    estimatedHeadcount: pick({ given: estimatedHeadcount, stored: before.estimatedHeadcount }),
    guaranteedHeadcount: pick({ given: guaranteedHeadcount, stored: before.guaranteedHeadcount }),
  };
  const path = value.guaranteedHeadcount === null ? "estimatedHeadcount" : "guaranteedHeadcount";
  return checkPeopleLimit({ context, orderId: before.id, headcount: { value, path } });
}
