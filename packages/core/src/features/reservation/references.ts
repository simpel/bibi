import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkReadable } from "../order/order-rules";

type Ctx = { context: Pick<OperationContext, "db" | "permissions"> };

export type ReferencesInput = Ctx & {
  customerId?: string | null;
  contactId?: string | null;
  requirements?: readonly { vocabularyValueId: string }[];
};

/** Customer, contact and list values a reservation names exist and the caller may read them. */
export async function checkReferences({
  context,
  customerId,
  contactId,
  requirements,
}: ReferencesInput): Promise<Result<true>> {
  if (customerId || contactId) {
    const readable = checkReadable({ context, permission: "customer:read", path: "customerId" });
    if (!readable.ok) return readable;
  }
  if (contactId && !customerId) {
    const message = "A contact needs its customer";
    return invalid({ message, issues: [{ path: "customerId", message }] });
  }
  if (customerId) {
    const found = await context.db.customer.findFirst({
      where: { id: customerId },
      select: { id: true },
    });
    if (!found)
      return invalid({
        message: "Unknown customer",
        issues: [{ path: "customerId", message: "Unknown customer" }],
      });
  }
  if (contactId && customerId) {
    const contact = await context.db.contact.findFirst({
      where: { id: contactId, customerId },
      select: { id: true },
    });
    if (!contact) {
      const message = "The contact does not work at the customer";
      return invalid({ message, issues: [{ path: "contactId", message }] });
    }
  }
  const valueIds = [...new Set((requirements ?? []).map((row) => row.vocabularyValueId))];
  if (valueIds.length !== (requirements ?? []).length) {
    const message = "A list value twice";
    return invalid({ message, issues: [{ path: "requirements", message }] });
  }
  if (valueIds.length > 0) {
    const found = await context.db.vocabularyValue.count({ where: { id: { in: valueIds } } });
    if (found !== valueIds.length) {
      const message = "Unknown list value";
      return invalid({ message, issues: [{ path: "requirements", message }] });
    }
  }
  return ok({ value: true });
}
