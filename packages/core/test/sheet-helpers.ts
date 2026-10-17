import {
  assignAssignment,
  changeBookingStatus,
  createEntityType,
  createFieldDefinition,
  createSheetDefinition,
  type ExecuteContext,
  execute,
  updateItem,
  updateRequirement,
} from "../src/index";
import { memberUser } from "./booking-helpers";
import { statusByName } from "./booking-status-helpers";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { addProgramItem } from "./program-item-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";

type ContextInput = { context: ExecuteContext };

/** A bookable item type "Lounge" with a Floor field, and the room Älvsalen on the second floor. */
async function createLounge({ context }: ContextInput) {
  const roomType = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Lounge", behaviours: ["BOOKABLE"] },
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

/** "Kitchen order" for the fixed owner role: the lounge type and field, and the Allergens list. */
async function createKitchenOrder({ context, entityTypeId, fieldId, listId }: DefinitionInput) {
  const input = {
    name: "Kitchen order",
    entityTypeIds: [entityTypeId],
    fieldIds: [fieldId],
    vocabularyIds: [listId],
    roleId: "owner",
  };
  return unwrap({ result: await execute({ operation: createSheetDefinition, input, context }) });
}

/**
 * A tentative booking with the room Älvsalen on a program item 14–15, 5 gluten-free guests on
 * the booking, and the sheet definition "Kitchen order" that includes both.
 */
export async function sheetSetup() {
  const setup = await requirementSetup();
  const { context, booking, morning, type, gluten, list } = setup;
  const { roomType, floor, room } = await createLounge({ context });
  const held = unwrap({
    result: await addProgramItem({
      context,
      bookingId: booking.id,
      entityTypeId: morning.entityTypeId,
      itemId: room.id,
      from: 14,
      to: 15,
    }),
  });
  const base = { context, bookingId: booking.id, entityTypeId: type.id };
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

export type ConfirmInput = { context: ExecuteContext; bookingId: string };

/** Gives the booking a main assignee and moves it to the CONFIRMED phase. */
export async function confirmBooking({ context, bookingId }: ConfirmInput) {
  const assigneeId = await memberUser({ context, name: "Johan Ek" });
  unwrap({
    result: await execute({
      operation: assignAssignment,
      input: { subjectType: "BOOKING", subjectId: bookingId, assigneeId },
      context,
    }),
  });
  const confirmed = await statusByName({ context, name: "Confirmed" });
  unwrap({
    result: await execute({
      operation: changeBookingStatus,
      input: { bookingId, statusId: confirmed.id },
      context,
    }),
  });
}

export type SetCountInput = { context: ExecuteContext; id: string; quantity: number };

/** Changes a requirement's count. */
export const setCount = ({ context, id, quantity }: SetCountInput) =>
  execute({ operation: updateRequirement, input: { id, quantity }, context });
