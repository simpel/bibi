import {
  assignAssignment,
  changeTicketPhase,
  createEntityType,
  createFieldDefinition,
  createSheetDefinition,
  type ExecuteContext,
  execute,
  updateItem,
  updateRequirement,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { createTestLine } from "./line-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";
import { createTestResponsibility } from "./responsibility-helpers";
import { memberUser } from "./ticket-helpers";
import { phaseByName } from "./ticket-phase-helpers";

type ContextInput = { context: ExecuteContext };

/** A bookable item type "Lounge" with a Floor field, and the room Älvsalen on the second floor. */
async function createLounge({ context }: ContextInput) {
  const roomType = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Lounge", capabilities: ["BOOKABLE"] },
      context,
    }),
  });
  const floor = unwrap({
    result: await execute({
      operation: createFieldDefinition,
      input: { entityTypeId: roomType.id, name: "Floor", kind: "TEXT" },
      context,
    }),
  });
  const room = await createTestItem({ context, entityTypeId: roomType.id, name: "Älvsalen" });
  const fields = { [floor.key]: "Second" };
  unwrap({
    result: await execute({ operation: updateItem, input: { id: room.id, fields }, context }),
  });
  return { roomType, floor, room };
}

type DefinitionInput = ContextInput & { entityTypeId: string; fieldId: string; listId: string };

/** "Kitchen order" for Head of kitchen: the lounge type and field, and the Allergens list. */
async function createKitchenOrder({ context, entityTypeId, fieldId, listId }: DefinitionInput) {
  const input = {
    name: "Kitchen order",
    entityTypeIds: [entityTypeId],
    fieldIds: [fieldId],
    vocabularyIds: [listId],
    responsibilityId: (await createTestResponsibility({ context })).id,
  };
  return unwrap({ result: await execute({ operation: createSheetDefinition, input, context }) });
}

/**
 * A tentative ticket with the room Älvsalen on a line 14–15, 5 gluten-free guests on
 * the ticket, and the sheet definition "Kitchen order" that includes both.
 */
export async function sheetSetup() {
  const setup = await requirementSetup();
  const { context, ticket, morning, type, gluten, list } = setup;
  const { roomType, floor, room } = await createLounge({ context });
  const held = unwrap({
    result: await createTestLine({
      context,
      ticketId: ticket.id,
      entityTypeId: morning.entityTypeId,
      itemId: room.id,
      from: 14,
      to: 15,
    }),
  });
  const base = { context, ticketId: ticket.id, entityTypeId: type.id };
  const count = unwrap({
    result: await addRequirement({ ...base, vocabularyValueId: gluten, quantity: 5 }),
  });
  const definition = await createKitchenOrder({
    context,
    entityTypeId: roomType.id,
    fieldId: floor.id,
    listId: list.id,
  });
  return { ...setup, room, roomType, floor, held, count, definition };
}

export type SetupResult = Awaited<ReturnType<typeof sheetSetup>>;

export type ConfirmInput = { context: ExecuteContext; ticketId: string };

/** Gives the ticket a main assignee and moves it to the CONFIRMED phase. */
export async function confirmTicket({ context, ticketId }: ConfirmInput) {
  const assigneeId = await memberUser({ context, name: "Johan Ek" });
  unwrap({
    result: await execute({
      operation: assignAssignment,
      input: { subjectType: "TICKET", subjectId: ticketId, assigneeId },
      context,
    }),
  });
  const confirmed = await phaseByName({ context, name: "Confirmed" });
  unwrap({
    result: await execute({
      operation: changeTicketPhase,
      input: { ticketId, phaseId: confirmed.id },
      context,
    }),
  });
}

export type SetCountInput = { context: ExecuteContext; id: string; quantity: number };

/** Changes a requirement's count. */
export const setCount = ({ context, id, quantity }: SetCountInput) =>
  execute({ operation: updateRequirement, input: { id, quantity }, context });
