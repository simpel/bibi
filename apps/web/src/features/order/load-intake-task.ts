import "server-only";
import { getContact } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { loadCustomer } from "../customer/load-customer";
import { loadTask } from "../task/load-task";
import type { IntakeTask } from "./intake/intake-task";

/**
 * The task `?fromTask=<id>` names, when the caller may read it and it has no order yet; its
 * customer, contact and note prefill the intake. Otherwise null and the intake starts as usual
 * (`order.create` checks the link again).
 */
export async function loadIntakeTask({
  id,
}: {
  id: string | undefined;
}): Promise<IntakeTask | null> {
  if (!id) return null;
  const task = await loadTask({ id });
  if (!task.ok || task.value.orderId || task.value.status !== "ACTIVE") return null;
  const { customerId, contactId, note } = task.value;
  const [customer, contact] = await Promise.all([
    loadCustomer({ id: customerId }),
    runOperation({ operation: getContact, input: { id: contactId } }),
  ]);
  if (!customer.ok || !contact.ok) return null;
  return {
    id,
    note: note ?? "",
    who: {
      ...{ customerId, customerName: customer.value.name },
      ...{ contactId, contactName: contact.value.name },
    },
  };
}
