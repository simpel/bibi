import {
  createEntityType,
  createTask,
  type ExecuteContext,
  execute,
  type TaskCreateInput,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { unwrap } from "./helpers";
import { readingMember } from "./notification-helpers";
import { createBookableItem } from "./occupancy-helpers";
import { contactAt, orderSetup } from "./order-helpers";

const HOUR = 3_600_000;

/** `hours` from now (negative = past). */
export const inHours = ({ hours }: { hours: number }) => new Date(Date.now() + hours * HOUR);

/**
 * A provisioned organization (`orderSetup`) whose actor is a member, with two task types (a
 * site visit and a headcount deadline), a contact at the customer and a bookable room (ADR 0117).
 */
export async function taskSetup() {
  const base = await orderSetup();
  const { context, customer } = base;
  const type = ({ name }: { name: string }) =>
    execute({ operation: createEntityType, input: { base: "TASK", name }, context });
  const meeting = unwrap({ result: await type({ name: "Site visit" }) });
  const deadline = unwrap({ result: await type({ name: "Headcount due" }) });
  const contact = await contactAt({ context, customerId: customer.id });
  const room = await createBookableItem({ context });
  const other = await createTestCustomer({ context, name: "Other AB" });
  const otherContact = await contactAt({ context, customerId: other.id });
  const anna = await readingMember({ context, name: "Anna Berg" });
  return { ...base, meeting, deadline, contact, room, other, otherContact, anna };
}

export type TaskSetup = Awaited<ReturnType<typeof taskSetup>>;

export type AddTaskInput = { context: ExecuteContext; setup: TaskSetup } & Partial<TaskCreateInput>;

/** `task.create` of a site visit due in 24 hours for the setup's customer, unless overridden. */
export const addTask = ({ context, setup, ...input }: AddTaskInput) =>
  execute({
    operation: createTask,
    input: {
      entityTypeId: setup.meeting.id,
      customerId: setup.customer.id,
      contactId: setup.contact.id,
      dueAt: inHours({ hours: 24 }),
      ...input,
    },
    context,
  });
