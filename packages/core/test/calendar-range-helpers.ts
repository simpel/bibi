import {
  type CalendarRange,
  calendarRange,
  createOccupancy,
  type ExecuteContext,
  execute,
} from "../src/index";
import { unwrap } from "./helpers";
import { createHoldLine } from "./hold-helpers";
import { createBookableItem, hours } from "./occupancy-helpers";
import { ticketSetup } from "./ticket-helpers";

export type RangeInput = { context: ExecuteContext; input: Record<string, unknown> };

/** `calendar.range` as a result, for error cases. */
export const runRange = ({ context, input }: RangeInput) =>
  execute({ operation: calendarRange, input, context });

/** `calendar.range`, unwrapped. */
export async function range({ context, input }: RangeInput): Promise<CalendarRange> {
  return unwrap({ result: await runRange({ context, input }) });
}

/**
 * An organization in Europe/Stockholm with one bookable item, a hard-hold line 09–11 UTC and a
 * maintenance block 13–14 UTC, both on 1 November 2026.
 */
export async function calendarSetup() {
  const setup = await ticketSetup();
  const { context } = setup;
  const item = await createBookableItem({ context });
  const line = unwrap({
    result: await createHoldLine({ context, itemId: item.id, hold: "HARD", from: 9, to: 11 }),
  });
  const block = { itemId: item.id, type: "MAINTENANCE" as const, note: "Floor polish" };
  const manual = unwrap({
    result: await execute({
      operation: createOccupancy,
      input: { ...block, ...hours({ from: 13, to: 14 }) },
      context,
    }),
  });
  return { ...setup, item, line, manual };
}
