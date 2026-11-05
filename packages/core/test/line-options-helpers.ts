import {
  chooseLineOptions,
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  type ItemCreateInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { addTestLines, quoteSetup } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

async function createType({ context, customisations }: Ctx & { customisations: boolean }) {
  const capabilities = customisations
    ? ["PRICED" as const, "CUSTOMISATIONS" as const]
    : ["PRICED" as const];
  const name = customisations ? "Room" : "Service";
  const input = { base: "ITEM" as const, name, capabilities };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

const make = async ({ context, ...input }: Ctx & ItemCreateInput) =>
  unwrap({ result: await execute({ operation: createItem, input, context }) });

/**
 * The quote setup plus a room at 1 000 kr (flat, 25 %) with two groups: "Installation" (pick 1:
 * "Our technician" 500 kr EXTRA, "Self-install" INCLUDED) and "Furniture" (pick 0 or 1:
 * "Lounge" 1 500 kr REPLACES). One line for the room on the order, quantity 1.
 */
export async function optionsSetup() {
  const setup = await quoteSetup();
  const { context, order, lineType } = setup;
  const service = await createType({ context, customisations: false });
  const priced = { entityTypeId: service.id, priceUnit: "FLAT" as const, vatRatePercent: 25 };
  const technician = await make({ context, ...priced, name: "Our technician", priceMinor: 50_000 });
  const selfInstall = await make({ context, ...priced, name: "Self-install", priceMinor: 0 });
  const lounge = await make({ context, ...priced, name: "Lounge", priceMinor: 150_000 });
  const roomType = await createType({ context, customisations: true });
  const customisationGroups = [
    {
      ...{ name: "Installation", minPick: 1, maxPick: 1, split: false },
      options: [
        { itemId: technician.id, priceEffect: "EXTRA" as const },
        { itemId: selfInstall.id, priceEffect: "INCLUDED" as const },
      ],
    },
    {
      ...{ name: "Furniture", minPick: 0, maxPick: 1, split: false },
      options: [{ itemId: lounge.id, priceEffect: "REPLACES" as const }],
    },
  ];
  const room = await make({
    ...{ context, entityTypeId: roomType.id, name: "Hönö", customisationGroups },
    ...{ priceMinor: 100_000, priceUnit: "FLAT" as const, vatRatePercent: 25 },
  });
  const lines = [{ itemId: room.id, name: "Hönö", quantity: 1 }];
  const [line] = await addTestLines({
    context,
    orderId: order.id,
    lineTypeId: lineType.id,
    lines,
  });
  return { ...setup, room, technician, selfInstall, lounge, lineId: line?.id ?? "" };
}

/** A chosen option: its item id, with a quantity in a split group (ADR 0082). */
export type TestOption = { itemId: string; quantity?: number };

export type ChooseInput = Ctx & { lineId: string; options: TestOption[] };

export const choose = ({ context, lineId, options }: ChooseInput) =>
  execute({ operation: chooseLineOptions, input: { lineId, options }, context });

/** Options of normal groups: the item ids alone. */
export const picks = ({ ids }: { ids: string[] }): TestOption[] =>
  ids.map((itemId) => ({ itemId }));
