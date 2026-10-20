import {
  cellsFromTemplate,
  phasesFromTemplate,
  statesFromTemplate,
} from "../src/features/pipeline-setup/draft-from-templates";
import {
  createEntityType,
  type ExecuteContext,
  execute,
  type PipelineSetupDraft,
} from "../src/index";
import { unwrap } from "./helpers";

export type EstateDraftInput = { roomTypeId?: string };

/**
 * The "Conference estate" phases with a room type (bookable, existing when `roomTypeId` is
 * given) and a new food type, its grid filled from the template.
 */
export function estateDraft({ roomTypeId }: EstateDraftInput = {}): PipelineSetupDraft {
  const room = statesFromTemplate({ template: "bookable", bookable: true });
  const food = statesFromTemplate({ template: "food", bookable: false });
  const itemTypes = [
    {
      ...(roomTypeId ? { entityTypeId: roomTypeId } : { capabilities: ["BOOKABLE" as const] }),
      name: "Room",
      ...room,
    },
    { name: "Dish", ...food },
  ];
  const template = "conference-estate" as const;
  const phases = phasesFromTemplate({ template });
  return { itemTypes, phases, cells: cellsFromTemplate({ template, phases, itemTypes }) };
}

export type RoomTypeInput = { context: ExecuteContext };

/** An existing bookable item type "Room" with only its default state. */
export async function roomType({ context }: RoomTypeInput) {
  const input = { base: "ITEM" as const, name: "Room", capabilities: ["BOOKABLE" as const] };
  return unwrap({ result: await execute({ operation: createEntityType, input, context }) });
}
