import {
  createEntityType,
  createFieldDefinition,
  createItem,
  createLine,
  createQuote,
  createVocabulary,
  type ExecuteContext,
  execute,
  type ItemCreateInput,
  type QuoteCreateInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestTicket, memberUser, ticketSetup } from "./ticket-helpers";

type Ctx = { context: ExecuteContext };

/** A PRICED dish type whose "Allergens" field picks from a list, so its items carry tags. */
async function createPricedDishType({ context }: Ctx) {
  const list = unwrap({
    result: await execute({
      operation: createVocabulary,
      input: { name: "Allergens", values: ["Gluten", "Milk"] },
      context,
    }),
  });
  const type = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "ITEM", name: "Dish", behaviours: ["PRICED"] },
      context,
    }),
  });
  const input = { entityTypeId: type.id, kind: "MULTI_CHOICE" as const, vocabularyId: list.id };
  const field = { ...input, name: "Allergens" };
  unwrap({ result: await execute({ operation: createFieldDefinition, input: field, context }) });
  const gluten = list.values.find((value) => value.name === "Gluten")?.id ?? "";
  return { type, gluten };
}

/** Lunch (250 kr, 12 % VAT, contains Gluten), coffee (40 kr, 12 %) and a dish without a price. */
async function createDishes({ context }: Ctx) {
  const { type, gluten } = await createPricedDishType({ context });
  const make = async ({ name, ...input }: Omit<ItemCreateInput, "entityTypeId">) =>
    unwrap({
      result: await execute({
        operation: createItem,
        input: { entityTypeId: type.id, name, ...input },
        context,
      }),
    });
  const lunch = await make({
    name: "Lunch",
    priceMinor: 25_000,
    priceUnit: "PER_PERSON",
    vatRatePercent: 12,
    fields: { allergens: [gluten] },
  });
  const coffee = await make({ name: "Coffee", priceMinor: 4_000, vatRatePercent: 12 });
  const unpriced = await make({ name: "Surprise", vatRatePercent: 25 });
  return { lunch, coffee, unpriced, gluten };
}

/**
 * A provisioned org with a ticket for 20 people (salesperson Erik assigned), priced dishes and a
 * line type for the ticket's lines.
 */
export async function quoteSetup() {
  const setup = await ticketSetup();
  const { context } = setup;
  const erik = await memberUser({ context, name: "Erik Lund" });
  const ticket = await createTestTicket({
    context,
    entityTypeId: setup.type.id,
    customerId: setup.customer.id,
    assigneeId: erik,
    estimatedHeadcount: 20,
  });
  const lineType = unwrap({
    result: await execute({
      operation: createEntityType,
      input: { base: "LINE", name: "Program point" },
      context,
    }),
  });
  return { ...setup, erik, ticket, lineType, ...(await createDishes({ context })) };
}

/** An untimed line; quantity, price and discount are the line's own overrides when given. */
export type TestLine = {
  itemId: string;
  name?: string;
  quantity?: number | null;
  unitPriceMinor?: number;
  discountPercent?: number;
};

export type AddTestLinesInput = Ctx & {
  ticketId: string;
  lineTypeId: string;
  lines: readonly TestLine[];
};

/** Adds the lines to the ticket in order (`line.create`) and returns them. */
export async function addTestLines({ context, ticketId, lineTypeId, lines }: AddTestLinesInput) {
  const created = [];
  for (const { name = "Lunch", ...line } of lines) {
    const input = { ticketId, entityTypeId: lineTypeId, name, ...line };
    created.push(unwrap({ result: await execute({ operation: createLine, input, context }) }));
  }
  return created;
}

export type CreateTestQuoteInput = Ctx &
  Omit<QuoteCreateInput, "validUntil"> & {
    validUntil?: Date | null;
  };

/** A quote valid for 30 days. */
export async function createTestQuote({ context, ...input }: CreateTestQuoteInput) {
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return unwrap({
    result: await execute({ operation: createQuote, input: { validUntil, ...input }, context }),
  });
}

/** A quote setup whose ticket has one lunch line (counting the headcount) and a DRAFT quote. */
export async function draftQuote() {
  const setup = await quoteSetup();
  const { context, ticket, lineType } = setup;
  const lines = [{ itemId: setup.lunch.id }];
  const [line] = await addTestLines({
    ...{ context, ticketId: ticket.id, lineTypeId: lineType.id, lines },
  });
  const quote = await createTestQuote({ context, ticketId: ticket.id });
  return { ...setup, quote, lineId: line?.id ?? "" };
}
