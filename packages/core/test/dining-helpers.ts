import {
  createItem,
  createLayout,
  type ExecuteContext,
  execute,
  importFloorElementKinds,
  listFloorElementKinds,
  saveLayout,
} from "../src/index";
import { unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";

type Ctx = { context: ExecuteContext };

/** Test setup for table booking (ADR 0119): a room, its starter furniture and layouts. */

/** A room with the starter library and one empty layout "Dinner"; the round table's kind id. */
export async function roomWithLayout({ context }: Ctx) {
  const type = await createRoomType({ context });
  const input = { entityTypeId: type.id, name: "Kajen", maxPeople: 100 };
  const item = unwrap({ result: await execute({ operation: createItem, input, context }) });
  const template = { template: "conference-banquet" as const };
  unwrap({
    result: await execute({ operation: importFloorElementKinds, input: template, context }),
  });
  const kinds = unwrap({
    result: await execute({ operation: listFloorElementKinds, input: { limit: 100 }, context }),
  });
  const round = kinds.items.find((kind) => kind.name === "Round table Ø180");
  if (!round) throw new Error("round table kind missing");
  const layout = unwrap({
    result: await execute({
      operation: createLayout,
      input: { itemId: item.id, name: "Dinner" },
      context,
    }),
  });
  return { item, layout, roundId: round.id };
}

export type SaveInput = Ctx & {
  id: string;
  version: number;
  elements: {
    id?: string;
    kindId: string;
    xCm: number;
    yCm: number;
    label?: string;
    minCovers?: number | null;
    maxCovers?: number | null;
    onlineBookable?: boolean;
  }[];
};

export const saveTables = async ({ context, id, version, elements }: SaveInput) =>
  unwrap({
    result: await execute({
      operation: saveLayout,
      input: { id, expectedVersion: version, elements },
      context,
    }),
  });
