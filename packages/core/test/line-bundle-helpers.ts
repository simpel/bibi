import {
  createEntityType,
  createItem,
  type ExecuteContext,
  execute,
  expandLineBundle,
  type LineExpandBundleInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";
import { hours } from "./occupancy-helpers";
import { quoteSetup } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

/** A PRICED `BUNDLE` type. */
async function createBundleType({ context }: Ctx) {
  const capabilities = ["PRICED" as const, "BUNDLE" as const];
  const input = { base: "ITEM" as const, name: "Bundle", capabilities };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}

/**
 * The quote setup (ticket for 20, lunch 250 kr and coffee 40 kr at 12 %) plus a room at 1 000 kr
 * and 25 %, and the bundle "Conference day" at 600 kr per person: the room for the whole bundle,
 * coffee 90 minutes in for 30 minutes and lunch 3 hours in for an hour.
 */
export async function bundleSetup() {
  const setup = await quoteSetup();
  const { context, lunch, coffee } = setup;
  const roomType = await createRoomType({ context });
  const room = unwrap({
    result: await execute({
      operation: createItem,
      input: { entityTypeId: roomType.id, name: "Hönö", priceMinor: 100_000, vatRatePercent: 25 },
      context,
    }),
  });
  const type = await createBundleType({ context });
  const parts = [
    { itemId: room.id },
    { itemId: coffee.id, offsetMinutes: 90, durationMinutes: 30 },
    { itemId: lunch.id, offsetMinutes: 180, durationMinutes: 60 },
  ];
  const bundle = unwrap({
    result: await execute({
      operation: createItem,
      input: {
        ...{ entityTypeId: type.id, name: "Conference day", parts },
        ...{ priceMinor: 60_000, priceUnit: "PER_PERSON" as const, vatRatePercent: 25 },
      },
      context,
    }),
  });
  return { ...setup, room, bundle, bundleType: type };
}

export type ExpandInput = Ctx &
  Partial<LineExpandBundleInput> & { ticketId: string; entityTypeId: string; itemId: string };

/** `line.expandBundle` from 09:00 to 17:00 on 1 November 2026 (UTC) unless times are given. */
export const expand = ({ context, ...input }: ExpandInput) =>
  execute({
    operation: expandLineBundle,
    input: { ...hours({ from: 9, to: 17 }), ...input },
    context,
  });
