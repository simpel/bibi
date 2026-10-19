import {
  createTicketTemplate,
  type ExecuteContext,
  execute,
  listEntityTypes,
  type TicketTemplateLineInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { type GridSetup, gridSetup, setCell } from "./phase-grid-helpers";
import { phaseByName } from "./ticket-phase-helpers";

type Ctx = { context: ExecuteContext };

/** `Confirmed` takes tickets: room lines go to Booked and dishes to Locked (ADR 0044). */
async function confirmedGrid({ setup }: { setup: GridSetup }) {
  const { context, room, roomState, food } = setup;
  for (const cell of [
    { entityTypeId: room.entityTypeId, stateId: roomState.booked.id },
    { entityTypeId: food.type.id, stateId: food.locked.id },
  ]) {
    unwrap({ result: await setCell({ context, phase: "Confirmed", ...cell }) });
  }
}

export type TemplateLinesInput = { setup: GridSetup };

/** A room for two hours from the start and a dish per guest right after. */
export const roomAndDish = ({ setup }: TemplateLinesInput): TicketTemplateLineInput[] => [
  {
    entityTypeId: setup.lineType.id,
    name: "Meeting room",
    itemId: setup.room.id,
    offsetMinutes: 0,
    durationMinutes: 120,
    quantity: 1,
  },
  {
    entityTypeId: setup.lineType.id,
    name: "Coffee",
    itemId: setup.food.dish.id,
    offsetMinutes: 30,
    durationMinutes: 15,
  },
];

/** The grid setup plus the phase and ticket type a template needs; Confirmed is set up. */
export async function templateSetup() {
  const setup = await gridSetup();
  await confirmedGrid({ setup });
  const { context } = setup;
  const confirmed = await phaseByName({ context, name: "Confirmed" });
  const ticketType = unwrap({
    result: await execute({
      operation: listEntityTypes,
      input: { base: "TICKET" },
      context,
    }),
  }).items[0];
  if (!ticketType) throw new Error("No ticket type");
  return { ...setup, confirmed, ticketType };
}

export type TemplateSetup = Awaited<ReturnType<typeof templateSetup>>;

export type MakeTemplateInput = Ctx & {
  setup: TemplateSetup;
  phaseId?: string;
  lines?: TicketTemplateLineInput[];
};

/** `ticketTemplate.create` starting in Confirmed with the room and dish lines by default. */
export const makeTemplate = ({ context, setup, phaseId, lines }: MakeTemplateInput) =>
  execute({
    operation: createTicketTemplate,
    input: {
      name: "Small meeting",
      entityTypeId: setup.ticketType.id,
      phaseId: phaseId ?? setup.confirmed.id,
      lines: lines ?? roomAndDish({ setup }),
    },
    context,
  });
