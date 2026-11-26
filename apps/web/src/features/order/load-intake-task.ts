import "server-only";
import { getContact, getItem, type TaskDto } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import { loadCustomer } from "../customer/load-customer";
import { loadTask } from "../task/load-task";
import type { IntakeTask, IntakeTaskRoom } from "./intake/intake-task";

/**
 * The task `?fromTask=<id>` names, when the caller may read it and it has no order yet; its
 * customer, contact and note prefill the intake (a customer without a contact prefills the note only). Otherwise null and the intake starts as usual
 * (`order.create` checks the link again).
 */
/** The task's prebooked and booked rooms with their names, which Create carries over (ADR 0120). */
async function heldRooms({ task }: { task: TaskDto }): Promise<IntakeTaskRoom[]> {
  const held = task.items.flatMap((item) =>
    item.hold !== "RELATED" && item.startsAt && item.endsAt
      ? [{ itemId: item.itemId, hold: item.hold, startsAt: item.startsAt, endsAt: item.endsAt }]
      : [],
  );
  const names = await Promise.all(
    held.map((room) => runOperation({ operation: getItem, input: { id: room.itemId } })),
  );
  return held.map((room, index) => {
    const item = names[index];
    return { ...room, name: item?.ok ? item.value.name : null };
  });
}

export async function loadIntakeTask({
  id,
}: {
  id: string | undefined;
}): Promise<IntakeTask | null> {
  if (!id) return null;
  const task = await loadTask({ id });
  if (!task.ok || task.value.orderId || task.value.status !== "ACTIVE") return null;
  const { customerId, contactId, note } = task.value;
  const rooms = await heldRooms({ task: task.value });
  // A task needs no customer or contact (ADR 0120): without both, the intake asks for them.
  if (!customerId || !contactId) return { id, note: note ?? "", who: null, rooms };
  const [customer, contact] = await Promise.all([
    loadCustomer({ id: customerId }),
    runOperation({ operation: getContact, input: { id: contactId } }),
  ]);
  if (!customer.ok || !contact.ok) return null;
  return {
    id,
    note: note ?? "",
    rooms,
    who: {
      ...{ customerId, customerName: customer.value.name },
      ...{ contactId, contactName: contact.value.name },
    },
  };
}
