import {
  createLine,
  type ExecuteContext,
  execute,
  type LineCreateOperationInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { quoteSetup } from "./quote-helpers";

type Ctx = { context: ExecuteContext };

export const START = new Date("2037-11-02T09:00:00.000Z");
export const END = new Date("2037-11-02T12:00:00.000Z");

export type AddLineInput = Ctx & Omit<LineCreateOperationInput, "name"> & { name?: string };

/** Runs `line.create` (an add-on when `parentLineId` is given) and returns the result. */
export const addLine = ({ context, name = "Extra", ...input }: AddLineInput) =>
  execute({ operation: createLine, input: { name, ...input }, context });

/**
 * The quote setup (a ticket for 20, lunch 250 kr and coffee 40 kr at 12 %) plus a timed lunch
 * line for 10 people on 2 November 2037, 09–12, as the parent of add-ons.
 */
export async function addOnSetup() {
  const setup = await quoteSetup();
  const { context, ticket, lineType, lunch } = setup;
  const parent = unwrap({
    result: await addLine({
      ...{ context, ticketId: ticket.id, entityTypeId: lineType.id, name: "Lunch" },
      ...{ itemId: lunch.id, quantity: 10, startsAt: START, endsAt: END },
    }),
  });
  return { ...setup, parent };
}
