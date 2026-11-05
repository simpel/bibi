import { createOrder, type ExecuteContext, execute, type OrderCreateInput } from "../src/index";
import { hours } from "./occupancy-helpers";
import { partyOf } from "./order-helpers";
import { type TemplateSetup, templateSetup } from "./order-template-helpers";

type Ctx = { context: ExecuteContext };

/** The template setup (Lead is the entry status; rooms start Prebooked) and a party to book for. */
export async function createSetup() {
  const setup = await templateSetup();
  const party = partyOf({ order: await setup.newOrder() });
  return { ...setup, party };
}

export type CreateSetup = Awaited<ReturnType<typeof createSetup>>;

export type RunCreateInput = Ctx & { input: Record<string, unknown> };

/** `order.create` as a result, for error cases. */
export const runCreate = ({ context, input }: RunCreateInput) =>
  execute({ operation: createOrder, input: input as OrderCreateInput, context });

export type CreateWithInput = { setup: CreateSetup; input?: Record<string, unknown> };

/** The order input for the setup's type and party, desired 1 November 2037 09–13 UTC. */
export const orderInput = ({ setup, input = {} }: CreateWithInput) => {
  const { startsAt, endsAt } = hours({ from: 9, to: 13 });
  return {
    entityTypeId: setup.orderType.id,
    ...setup.party,
    ...{ desiredStartsAt: startsAt, desiredEndsAt: endsAt, estimatedHeadcount: 8 },
    ...input,
  };
};

/** `order.create` with the setup's context; returns the result. */
export const createWith = ({ setup, input }: CreateWithInput) =>
  runCreate({ context: setup.context, input: orderInput({ setup, input }) });

export type RoomLineInput = { setup: TemplateSetup; from: number; to: number; name?: string };

/** A draft line on the setup's room for `[from, to)` on 1 November 2037 UTC. */
export const roomLine = ({ setup, from, to, name }: RoomLineInput) => ({
  entityTypeId: setup.lineType.id,
  name: name ?? `Room ${from}-${to}`,
  itemId: setup.room.id,
  ...hours({ from, to }),
});

export type LinesOfInput = Ctx & { orderId: string };

/** The order's active lines in creation order. */
export const linesOf = ({ context, orderId }: LinesOfInput) =>
  context.db.line.findMany({
    where: { orderId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

/** Every order of the organization, archived ones included. */
export const orderCount = ({ context }: Ctx) =>
  context.db.order.count({ where: { status: { in: ["ACTIVE", "ARCHIVED"] } } });
