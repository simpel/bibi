import { addDays, weekdayOf } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoDensity, DensitySlot } from "./density-types";
import type { DemoLine, DemoTicket } from "./ticket-types";
import { assetDay } from "./used-asset-days";

export type DensityTicketsInput = {
  density: DemoDensity;
  /** `asset@day` pairs the fixtures use (`usedAssetDays`). */
  reserved: ReadonlySet<string>;
  /** The day of the run; the seed reads its own now, the same day unless midnight passes. */
  now?: Date;
};

type Block = { asset: string; slot: DensitySlot; crew?: string };

/** A fixed spread per day offset, so every run makes the same days busy (no random numbers). */
const spread = ({ day }: { day: number }) => (((day * 37 + 11) % 97) + 97) % 97;

type DayInput = { density: DemoDensity; reserved: ReadonlySet<string>; day: number };

/** The day's blocks: how many by weekday, each on a free asset, turning through the assets. */
function blocksOf({ density, reserved, day, weekday }: DayInput & { weekday: number }): Block[] {
  const [min, max] = density.perWeekday[weekday] ?? [0, 0];
  const free = density.assets.filter((asset) => !reserved.has(assetDay({ asset, day })));
  const count = Math.min(free.length, min + (spread({ day }) % (max - min + 1)));
  const start = spread({ day }) % Math.max(1, free.length);
  return Array.from({ length: count }, (_, index) => {
    const turn = density.rotateSlots ? spread({ day }) : 0;
    const slot = density.slots[(turn + index) % density.slots.length] as DensitySlot;
    const crew = density.crew?.[index % density.crew.length];
    return { asset: free[(start + index) % free.length] as string, slot, crew };
  });
}

type TicketInput = { density: DemoDensity; day: number; index: number; blocks: Block[] };

/** One generated ticket over its blocks: a line per asset and per crew member on it. */
function ticketOf({ density, day, index, blocks }: TicketInput): DemoTicket {
  const shape = density.shapes[index % density.shapes.length] as DemoDensity["shapes"][number];
  const ref = `${density.prefix}${index + 1}`;
  const lineOf = ({ item, slot }: { item: string; slot: DensitySlot }): DemoLine => ({
    item,
    name: `${shape.label} · ${item} (${ref})`,
    ...slot,
  });
  const lines = blocks.flatMap(({ asset, slot, crew }) => [
    lineOf({ item: asset, slot }),
    ...(crew ? [lineOf({ item: crew, slot })] : []),
  ]);
  const froms = blocks.map((block) => block.slot.from).sort();
  const tos = blocks.map((block) => block.slot.to).sort();
  const { label: _label, ...ticket } = shape;
  return {
    ...ticket,
    ...{ ref, day, from: froms[0] ?? "09:00", to: tos.at(-1) ?? "17:00", lines },
    ...density.statusOf({ day, index }),
  };
}

/**
 * The generated tickets of `density` (#488), in day order and the same on every run of a day:
 * the day's blocks split into tickets of up to `perTicket`, each numbered in turn.
 */
export function densityTickets({
  density,
  reserved,
  now = new Date(),
}: DensityTicketsInput): DemoTicket[] {
  const today = toZonedParts({ instant: now, timeZone: density.timeZone }).date;
  const tickets: DemoTicket[] = [];
  for (let day = density.fromDay; day <= density.toDay; day += 1) {
    const weekday = weekdayOf({ date: addDays({ date: today, days: day }) });
    const blocks = blocksOf({ density, reserved, day, weekday });
    for (let at = 0; at < blocks.length; at += density.perTicket) {
      const chunk = blocks.slice(at, at + density.perTicket);
      tickets.push(ticketOf({ density, day, index: tickets.length, blocks: chunk }));
    }
  }
  return tickets;
}

/** How many blocks `density` asks for at least on a day offset, by its weekday. */
export function minBlocksOn({
  density,
  day,
  now = new Date(),
}: {
  density: DemoDensity;
  day: number;
  now?: Date;
}): number {
  const today = toZonedParts({ instant: now, timeZone: density.timeZone }).date;
  const weekday = weekdayOf({ date: addDays({ date: today, days: day }) });
  return density.perWeekday[weekday]?.[0] ?? 0;
}
