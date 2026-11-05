import {
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  type ItemCreateInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { addTestLines, quoteSetup } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

const make = async ({ context, ...input }: Ctx & ItemCreateInput) =>
  unwrap({ result: await execute({ operation: createItem, input, context }) });

async function createTypes({ context }: Ctx) {
  const type = async ({ name, customisations }: { name: string; customisations: boolean }) => {
    const capabilities = customisations
      ? ["PRICED" as const, "CUSTOMISATIONS" as const]
      : ["PRICED" as const];
    const input = { base: "ITEM" as const, name, capabilities };
    return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
  };
  return {
    dish: await type({ name: "Course", customisations: false }),
    menu: await type({ name: "Set menu", customisations: true }),
  };
}

/**
 * ADR 0082: the quote setup plus a dinner at 500 kr (25 %) with two split groups: "Main course"
 * (1 or 2 of "Fish" 100 kr EXTRA and "Vegetarian" 50 kr EXTRA) and "Menu" (0 or 1: "Vegan menu"
 * 600 kr REPLACES), and a normal group "Coffee" (0 or 1: "Espresso" 20 kr EXTRA). One dinner line
 * for 14 on the order.
 */
export async function splitSetup() {
  const setup = await quoteSetup();
  const { context, order, lineType } = setup;
  const { dish, menu } = await createTypes({ context });
  const priced = { entityTypeId: dish.id, priceUnit: "PER_PERSON" as const, vatRatePercent: 25 };
  const fish = await make({ context, ...priced, name: "Fish", priceMinor: 10_000 });
  const veg = await make({ context, ...priced, name: "Vegetarian", priceMinor: 5_000 });
  const vegan = await make({ context, ...priced, name: "Vegan menu", priceMinor: 60_000 });
  const espresso = await make({ context, ...priced, name: "Espresso", priceMinor: 2_000 });
  const extra = "EXTRA" as const;
  const customisationGroups = [
    {
      ...{ name: "Main course", minPick: 1, maxPick: 2, split: true },
      options: [
        { itemId: fish.id, priceEffect: extra },
        { itemId: veg.id, priceEffect: extra },
      ],
    },
    {
      ...{ name: "Menu", minPick: 0, maxPick: 1, split: true },
      options: [{ itemId: vegan.id, priceEffect: "REPLACES" as const }],
    },
    {
      ...{ name: "Coffee", minPick: 0, maxPick: 1, split: false },
      options: [{ itemId: espresso.id, priceEffect: extra }],
    },
  ];
  const dinner = await make({
    ...{ context, ...priced, entityTypeId: menu.id, name: "Dinner", customisationGroups },
    priceMinor: 50_000,
  });
  const lines = [{ itemId: dinner.id, name: "Dinner", quantity: 14 }];
  const [line] = await addTestLines({
    ...{ context, orderId: order.id, lineTypeId: lineType.id, lines },
  });
  return { ...setup, dinner, fish, veg, vegan, espresso, lineId: line?.id ?? "" };
}
