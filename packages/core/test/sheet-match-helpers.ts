import {
  createEntityType,
  createFieldDefinition,
  createItem,
  createSheetDefinition,
  type ExecuteContext,
  execute,
  type ItemChoiceGroupInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { addProgramItem } from "./program-item-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";

type Part = { itemId: string; required?: boolean };
type Ctx = { context: ExecuteContext };

/** Menu items are bookable, composable and tagged with Allergens (Gluten, Lactose). */
async function createMenuType({ context, listId }: Ctx & { listId: string }) {
  const behaviours = ["BOOKABLE", "COMPOSABLE", "CHOICES"] as ("BOOKABLE" | "COMPOSABLE")[];
  const input = { base: "ITEM" as const, name: "Menu", behaviours };
  const type = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
  const field = { entityTypeId: type.id, kind: "MULTI_CHOICE" as const, vocabularyId: listId };
  const tagged = { ...field, name: "Allergens" };
  unwrap({ result: await execute({ operation: createFieldDefinition, input: tagged, context }) });
  return type;
}

type MakeInput = Ctx & { entityTypeId: string; name: string; fields?: object } & {
  components?: Part[];
  choiceGroups?: ItemChoiceGroupInput[];
};

async function make({ context, ...input }: MakeInput) {
  return unwrap({ result: await execute({ operation: createItem, input, context }) }).id;
}

/**
 * A booking with a sheet definition over the Menu type and the Allergens list, and menus:
 * `mandatory` (bread with Gluten), `optional` (optional bread), `alternative` (bread or plain,
 * pick one), `lactose` (butter with Lactose) and `plain` (no tags).
 */
export async function matchSetup() {
  const setup = await requirementSetup();
  const { context, list, gluten, lactose } = setup;
  const type = await createMenuType({ context, listId: list.id });
  const base = { context, entityTypeId: type.id };
  const bread = await make({ ...base, name: "Bread", fields: { allergens: [gluten] } });
  const butter = await make({ ...base, name: "Butter", fields: { allergens: [lactose] } });
  const plain = await make({ ...base, name: "Plain" });
  const pick = [{ name: "Base", minPick: 1, maxPick: 1, itemIds: [bread, plain] }];
  const menus = {
    mandatory: await make({ ...base, name: "Mandatory", components: [{ itemId: bread }] }),
    optional: await make({
      ...base,
      name: "Optional",
      components: [{ itemId: bread, required: false }, { itemId: plain }],
    }),
    alternative: await make({
      ...base,
      name: "Alternative",
      components: [{ itemId: bread }, { itemId: plain }],
      choiceGroups: pick,
    }),
    lactose: butter,
    plain,
  };
  const definition = unwrap({
    result: await execute({
      operation: createSheetDefinition,
      input: {
        name: "Kitchen order",
        entityTypeIds: [type.id],
        fieldIds: [],
        vocabularyIds: [list.id],
        roleId: "owner",
      },
      context,
    }),
  });
  return { ...setup, menus, definition };
}

export type MatchSetup = Awaited<ReturnType<typeof matchSetup>>;

export type ServeInput = { setup: MatchSetup; menu: keyof MatchSetup["menus"] };

/** Serves the menu on a program item (16–17) of the booking. */
export async function serve({ setup, menu }: ServeInput) {
  const { context, booking, morning, menus } = setup;
  return unwrap({
    result: await addProgramItem({
      context,
      bookingId: booking.id,
      entityTypeId: morning.entityTypeId,
      itemId: menus[menu],
      from: 16,
      to: 17,
    }),
  });
}

export type CountInput = { setup: MatchSetup; value: string; quantity: number };

/** Counts guests on the booking for one list value. */
export async function countOnBooking({ setup, value, quantity }: CountInput) {
  const { context, booking, type } = setup;
  const base = { context, bookingId: booking.id, entityTypeId: type.id };
  return unwrap({ result: await addRequirement({ ...base, vocabularyValueId: value, quantity }) });
}
