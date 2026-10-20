import {
  chooseAlternative,
  createAlternativeGroup,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";
import { addLine, gridSetup } from "./phase-grid-helpers";

type Ctx = { context: ExecuteContext };

export type GroupLinesInput = Ctx & { ticketId: string; lineIds: string[]; name?: string };

/** `alternativeGroup.create`; returns the result. */
export const groupLines = ({ context, ticketId, lineIds, name = "Room" }: GroupLinesInput) =>
  execute({ operation: createAlternativeGroup, input: { ticketId, name, lineIds }, context });

export type ChooseInput = Ctx & { id: string; lineId: string };

/** `alternativeGroup.choose`; returns the result. */
export const choose = ({ context, id, lineId }: ChooseInput) =>
  execute({ operation: chooseAlternative, input: { id, lineId }, context });

/**
 * A ticket in Lead with two rooms of the bookable type held soft at the same time (Room A and
 * Room B, both Prebooked) and grouped as alternatives (ADR 0052).
 */
export async function roomAlternatives() {
  const setup = await gridSetup();
  const { context, room } = setup;
  const other = await createTestItem({ context, entityTypeId: room.entityTypeId, name: "Bersån" });
  const ticket = await setup.newTicket();
  const a = await addLine({ setup, ticketId: ticket.id, itemId: room.id });
  const b = await addLine({ setup, ticketId: ticket.id, itemId: other.id });
  const group = unwrap({
    result: await groupLines({ context, ticketId: ticket.id, lineIds: [a.id, b.id] }),
  });
  return { ...setup, ticket, a, b, group };
}
