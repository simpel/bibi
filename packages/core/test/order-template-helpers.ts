import {
  createOrderTemplate,
  type ExecuteContext,
  execute,
  listEntityTypes,
  type OrderTemplateLineInput,
} from "../src/index";
import { unwrap } from "./helpers";
import { type GridSetup, gridSetup, setCell } from "./status-grid-helpers";
import { statusByName } from "./order-status-helpers";

type Ctx = { context: ExecuteContext };

/** `Confirmed` takes orders: room lines go to Booked and dishes to Locked (ADR 0044). */
async function confirmedGrid({ setup }: { setup: GridSetup }) {
  const { context, room, roomState, food } = setup;
  for (const cell of [
    { entityTypeId: room.entityTypeId, stateId: roomState.booked.id },
    { entityTypeId: food.type.id, stateId: food.locked.id },
  ]) {
    unwrap({ result: await setCell({ context, orderStatus: "Confirmed", ...cell }) });
  }
}

export type TemplateLinesInput = { setup: GridSetup };

/** A room for two hours from the start and a dish per guest right after. */
export const roomAndDish = ({ setup }: TemplateLinesInput): OrderTemplateLineInput[] => [
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

/** The grid setup plus the status and order type a template needs; Confirmed is set up. */
export async function templateSetup() {
  const setup = await gridSetup();
  await confirmedGrid({ setup });
  const { context } = setup;
  const confirmed = await statusByName({ context, name: "Confirmed" });
  const orderType = unwrap({
    result: await execute({
      operation: listEntityTypes,
      input: { base: "ORDER" },
      context,
    }),
  }).items[0];
  if (!orderType) throw new Error("No order type");
  return { ...setup, confirmed, orderType };
}

export type TemplateSetup = Awaited<ReturnType<typeof templateSetup>>;

export type MakeTemplateInput = Ctx & {
  setup: TemplateSetup;
  statusId?: string;
  lines?: OrderTemplateLineInput[];
};

/** `orderTemplate.create` starting in Confirmed with the room and dish lines by default. */
export const makeTemplate = ({ context, setup, statusId, lines }: MakeTemplateInput) =>
  execute({
    operation: createOrderTemplate,
    input: {
      name: "Small meeting",
      entityTypeId: setup.orderType.id,
      statusId: statusId ?? setup.confirmed.id,
      lines: lines ?? roomAndDish({ setup }),
    },
    context,
  });
