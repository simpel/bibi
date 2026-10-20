import {
  createEntityType,
  createFieldDefinition,
  createItem,
  createSheetDefinition,
  type ExecuteContext,
  execute,
  type ItemCustomisationGroupInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestLine } from "./line-helpers";
import { addRequirement, requirementSetup } from "./requirement-helpers";
import { createTestResponsibility } from "./responsibility-helpers";

type Part = { itemId: string; required?: boolean };
type Ctx = { context: ExecuteContext };

/** Menu items are bookable bundles, tagged with Allergens (Gluten, Lactose). */
async function createMenuType({ context, listId }: Ctx & { listId: string }) {
  const capabilities = ["BOOKABLE", "BUNDLE", "CUSTOMISATIONS"] as ("BOOKABLE" | "BUNDLE")[];
  const input = { base: "ITEM" as const, name: "Menu", capabilities };
  const type = unwrap({ result: await execute({ operation: createEntityType, input, context }) });
  const field = { entityTypeId: type.id, kind: "MULTI_CHOICE" as const, vocabularyId: listId };
  const tagged = { ...field, name: "Allergens" };
  unwrap({ result: await execute({ operation: createFieldDefinition, input: tagged, context }) });
  return type;
}

type MakeInput = Ctx & { entityTypeId: string; name: string; fields?: object } & {
  parts?: Part[];
  customisationGroups?: ItemCustomisationGroupInput[];
};

async function make({ context, ...input }: MakeInput) {
  return unwrap({ result: await execute({ operation: createItem, input, context }) }).id;
}

/**
 * A ticket with a sheet definition over the Menu type and the Allergens list, and menus:
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
    mandatory: await make({ ...base, name: "Mandatory", parts: [{ itemId: bread }] }),
    optional: await make({
      ...base,
      name: "Optional",
      parts: [{ itemId: bread, required: false }, { itemId: plain }],
    }),
    alternative: await make({
      ...base,
      name: "Alternative",
      parts: [{ itemId: bread }, { itemId: plain }],
      customisationGroups: pick,
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
        responsibilityId: (await createTestResponsibility({ context })).id,
      },
      context,
    }),
  });
  return { ...setup, menus, definition };
}

export type MatchSetup = Awaited<ReturnType<typeof matchSetup>>;

export type ServeInput = { setup: MatchSetup; menu: keyof MatchSetup["menus"] };

/** Serves the menu on a line (16–17) of the ticket. */
export async function serve({ setup, menu }: ServeInput) {
  const { context, ticket, morning, menus } = setup;
  return unwrap({
    result: await createTestLine({
      context,
      ticketId: ticket.id,
      entityTypeId: morning.entityTypeId,
      itemId: menus[menu],
      from: 16,
      to: 17,
    }),
  });
}

export type CountInput = { setup: MatchSetup; value: string; quantity: number };

/** Counts guests on the ticket for one list value. */
export async function countOnTicket({ setup, value, quantity }: CountInput) {
  const { context, ticket, type } = setup;
  const base = { context, ticketId: ticket.id, entityTypeId: type.id };
  return unwrap({ result: await addRequirement({ ...base, vocabularyValueId: value, quantity }) });
}
