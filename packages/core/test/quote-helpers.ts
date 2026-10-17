import {
  createEntityType,
  createFieldDefinition,
  createItem,
  createQuote,
  createVocabulary,
  type ExecuteContext,
  execute,
  type ItemCreateInput,
  type QuoteCreateInput,
  qualifyInquiry,
} from "../src/index";
import { memberUser } from "./booking-helpers";
import { unwrap } from "./helpers";
import { createTestInquiry, inquirySetup } from "./inquiry-helpers";

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

/** A provisioned org with a QUALIFIED inquiry (salesperson Erik) and priced dishes. */
export async function quoteSetup() {
  const setup = await inquirySetup();
  const { context } = setup;
  const erik = await memberUser({ context, name: "Erik Lund" });
  const created = await createTestInquiry({
    context,
    entityTypeId: setup.type.id,
    customerId: setup.customer.id,
  });
  const inquiry = unwrap({
    result: await execute({
      operation: qualifyInquiry,
      input: { id: created.id, assigneeId: erik },
      context,
    }),
  });
  return { ...setup, erik, inquiry, ...(await createDishes({ context })) };
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
