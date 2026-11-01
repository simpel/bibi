import {
  type ExecuteContext,
  execute,
  previewTicketLines,
  type TicketPreviewLinesInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { toState } from "./item-state-helpers";
import { hours } from "./occupancy-helpers";
import { addLine } from "./status-grid-helpers";
import { type TemplateSetup, templateSetup } from "./ticket-template-helpers";

type Ctx = { context: ExecuteContext };

/** The template setup (Lead is the entry status; rooms start Prebooked) and a customer. */
export async function previewSetup() {
  const setup = await templateSetup();
  const { customerId } = await setup.newTicket();
  return { ...setup, customerId };
}

export type PreviewSetup = Awaited<ReturnType<typeof previewSetup>>;

export type RunPreviewInput = Ctx & { input: Record<string, unknown> };

/** `ticket.previewLines` as a result, for error cases. */
export const runPreview = ({ context, input }: RunPreviewInput) =>
  execute({ operation: previewTicketLines, input: input as TicketPreviewLinesInput, context });

export type PreviewInput = { setup: PreviewSetup; input: Record<string, unknown> };

/** `ticket.previewLines` for 1 November 2037 09–13 UTC, 8 guests, with the setup's customer. */
export const preview = async ({ setup, input }: PreviewInput) =>
  unwrap({
    result: await runPreview({
      context: setup.context,
      input: {
        customerId: setup.customerId,
        ...hours({ from: 9, to: 13 }),
        headcount: 8,
        ...input,
      },
    }),
  });

export type DraftLineInput = { setup: TemplateSetup; from: number; to: number; itemId?: string };

/** A draft line on the room (or the item given) for `[from, to)` on 1 November 2037 UTC. */
export const draftLine = ({ setup, from, to, itemId }: DraftLineInput) => ({
  entityTypeId: setup.lineType.id,
  name: `Line ${from}-${to}`,
  itemId: itemId ?? setup.room.id,
  ...hours({ from, to }),
});

export type BookRoomInput = { setup: PreviewSetup; from: number; hard: boolean };

/** Another ticket's two-hour line on the room from `from`, soft (Prebooked) or hard (Booked). */
export async function bookRoom({ setup, from, hard }: BookRoomInput) {
  const { context, room, roomState } = setup;
  const other = await setup.newTicket();
  const line = await addLine({ setup, ticketId: other.id, itemId: room.id, from });
  if (hard)
    unwrap({ result: await toState({ context, lineId: line.id, stateId: roomState.booked.id }) });
  return { ticket: other, line };
}
