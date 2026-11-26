import {
  createDiningService,
  createItem,
  createLayout,
  type ExecuteContext,
  execute,
  importFloorElementKinds,
  listFloorElementKinds,
  saveLayout,
  saveTableCombinations,
  setDiningRoom,
} from "../src/index";
import { addDays, type PlainDate, toIsoDate } from "../src/time/plain-date";
import { fromZonedParts, toZonedParts } from "../src/time/zoned-time";
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

/** A local date three days ahead in Stockholm, as `YYYY-MM-DD` and as a PlainDate. */
export function aheadDate({ days = 3 }: { days?: number } = {}) {
  const today = toZonedParts({ instant: new Date(), timeZone: "Europe/Stockholm" }).date;
  const date = addDays({ date: today, days });
  return { date, iso: toIsoDate({ date }) };
}

/** That date at hh:mm in Stockholm, as an instant. */
export const at = ({
  date,
  hour,
  minute = 0,
}: {
  date: PlainDate;
  hour: number;
  minute?: number;
}) => fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone: "Europe/Stockholm" });

/**
 * A dining room ready for bookings (ADR 0119): tables 1–2 for two, 3 for four, 4 for six
 * (not online), a "Long table" of 1 + 3, and an every-day Dinner sitting 17:00–21:00 every
 * 30 minutes, 120-minute turns, 10 new guests per slot.
 */
export async function diningRoomReady({ context }: Ctx) {
  const { item, layout, roundId } = await roomWithLayout({ context });
  const kinds = unwrap({
    result: await execute({ operation: listFloorElementKinds, input: { limit: 100 }, context }),
  });
  const four = kinds.items.find((kind) => kind.name.startsWith("Table 180"))?.id ?? roundId;
  const saved = await saveTables({
    ...{ context, id: layout.id, version: 1 },
    elements: [
      { kindId: roundId, xCm: 150, yCm: 150, label: "1", maxCovers: 2 },
      { kindId: roundId, xCm: 400, yCm: 150, label: "2", maxCovers: 2 },
      { kindId: four, xCm: 650, yCm: 150, label: "3", maxCovers: 4 },
      { kindId: roundId, xCm: 400, yCm: 500, label: "4", maxCovers: 6, onlineBookable: false },
    ],
  });
  const byLabel = new Map(saved.elements.map((piece) => [piece.label, piece.id]));
  const table = ({ label }: { label: string }) => byLabel.get(label) ?? "";
  unwrap({
    result: await execute({
      operation: saveTableCombinations,
      input: {
        layoutId: layout.id,
        combinations: [
          {
            name: "Long table",
            elementIds: [table({ label: "1" }), table({ label: "3" })],
            minCovers: 5,
            maxCovers: 6,
          },
        ],
      },
      context,
    }),
  });
  unwrap({
    result: await execute({
      operation: setDiningRoom,
      input: { itemId: item.id, slug: "kajen" },
      context,
    }),
  });
  const sitting = unwrap({
    result: await execute({
      operation: createDiningService,
      input: {
        ...{ roomItemId: item.id, layoutId: layout.id, name: "Dinner" },
        weekdays: [0, 1, 2, 3, 4, 5, 6],
        ...{ firstStartMinute: 17 * 60, lastStartMinute: 21 * 60, slotMinutes: 30 },
        turnTimes: [{ upToParty: 20, minutes: 120 }],
        maxCoversPerSlot: 10,
      },
      context,
    }),
  });
  return { item, layout, sitting, table };
}
