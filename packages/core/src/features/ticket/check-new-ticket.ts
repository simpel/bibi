import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import type { CheckedFields } from "../field-definition/split-links";
import type { TicketCreateInput } from "./schema";
import { checkContact, checkCustomer, checkDesiredPeriod, checkReadable } from "./ticket-rules";

const PASSED = ok({ value: true as const });

export type CheckNewTicketInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  input: TicketCreateInput;
};

/**
 * The checks every new ticket passes (`ticket.create`): a `TICKET` type, an active customer and
 * a contact at that customer the caller may read, a desired period that ends after it starts, an
 * assignee who is a member and field values that match the type. Returns the field values.
 */
export async function checkNewTicket({
  context,
  input,
}: CheckNewTicketInput): Promise<Result<CheckedFields>> {
  const { entityTypeId, customerId, assigneeId } = input;
  for (const check of [
    checkDesiredPeriod(input),
    checkReadable({ context, permission: "customer:read", path: "customerId" }),
    input.contactId
      ? checkReadable({ context, permission: "contact:read", path: "contactId" })
      : PASSED,
    await loadTypeOfBase({ context, entityTypeId, base: "TICKET" }),
    await checkCustomer({ context, customerId }),
    await checkContact({ context, contactId: input.contactId, customerId }),
    await checkNewAssignee({ context, assigneeId }),
  ]) {
    if (!check.ok) return check;
  }
  return validateFields({ context, entityTypeId, values: input.fields ?? {} });
}
