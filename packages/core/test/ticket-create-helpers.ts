import { createTicket, type ExecuteContext, execute, type TicketCreateInput } from "../src/index";
import { hours } from "./occupancy-helpers";
import { partyOf } from "./ticket-helpers";
import { type TemplateSetup, templateSetup } from "./ticket-template-helpers";

type Ctx = { context: ExecuteContext };

/** The template setup (Lead is the entry status; rooms start Prebooked) and a party to book for. */
export async function createSetup() {
  const setup = await templateSetup();
  const party = partyOf({ ticket: await setup.newTicket() });
  return { ...setup, party };
}

export type CreateSetup = Awaited<ReturnType<typeof createSetup>>;

export type RunCreateInput = Ctx & { input: Record<string, unknown> };

/** `ticket.create` as a result, for error cases. */
export const runCreate = ({ context, input }: RunCreateInput) =>
  execute({ operation: createTicket, input: input as TicketCreateInput, context });

export type CreateWithInput = { setup: CreateSetup; input?: Record<string, unknown> };

/** The ticket input for the setup's type and party, desired 1 November 2037 09–13 UTC. */
export const ticketInput = ({ setup, input = {} }: CreateWithInput) => {
  const { startsAt, endsAt } = hours({ from: 9, to: 13 });
  return {
    entityTypeId: setup.ticketType.id,
    ...setup.party,
    ...{ desiredStartsAt: startsAt, desiredEndsAt: endsAt, estimatedHeadcount: 8 },
    ...input,
  };
};

/** `ticket.create` with the setup's context; returns the result. */
export const createWith = ({ setup, input }: CreateWithInput) =>
  runCreate({ context: setup.context, input: ticketInput({ setup, input }) });

export type RoomLineInput = { setup: TemplateSetup; from: number; to: number; name?: string };

/** A draft line on the setup's room for `[from, to)` on 1 November 2037 UTC. */
export const roomLine = ({ setup, from, to, name }: RoomLineInput) => ({
  entityTypeId: setup.lineType.id,
  name: name ?? `Room ${from}-${to}`,
  itemId: setup.room.id,
  ...hours({ from, to }),
});

export type LinesOfInput = Ctx & { ticketId: string };

/** The ticket's active lines in creation order. */
export const linesOf = ({ context, ticketId }: LinesOfInput) =>
  context.db.line.findMany({
    where: { ticketId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

/** Every ticket of the organization, archived ones included. */
export const ticketCount = ({ context }: Ctx) =>
  context.db.ticket.count({ where: { status: { in: ["ACTIVE", "ARCHIVED"] } } });
