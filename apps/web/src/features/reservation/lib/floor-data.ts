import type { DaySittingSchema, LayoutDto } from "@bibi/core/schemas";
import type { z } from "zod";
import { storedToDrawing } from "@/features/floor-plan/lib/to-drawing";
import { minuteToTime } from "../../table-booking/lib/clock";
import { atTime } from "../../table-booking/lib/edge-time";
import type { FloorPlanData } from "../ui/floor-plan-panel";

const SEATED = new Set(["ROUND", "RECT"]);

type DaySitting = z.infer<typeof DaySittingSchema>;

export type FloorSitting = {
  id: string;
  layoutId: string;
  first: number;
  last: number;
  slot: number;
  closed: boolean;
};

/** A sitting of the day view in the floor's shape. */
export function toFloorSitting({ sitting }: { sitting: DaySitting }): FloorSitting {
  return {
    id: sitting.id,
    layoutId: sitting.layoutId,
    first: sitting.firstStartMinute,
    last: sitting.lastStartMinute,
    slot: sitting.slotMinutes,
    closed: sitting.closed,
  };
}

/** The sitting the floor shows: the first one open that day, else the first. */
export function floorSitting({ sittings }: { sittings: readonly FloorSitting[] }) {
  return sittings.find((sitting) => !sitting.closed) ?? sittings[0] ?? null;
}

export type FloorPlanInput = { layout: LayoutDto; tableName: (label: string) => string };

/** A layout as the read-only drawing takes it: fixed parts, tables and the rest. */
export function floorPlanData({ layout, tableName }: FloorPlanInput): FloorPlanData {
  const drawn = layout.elements.map((element) => {
    const drawing = storedToDrawing({ element });
    return { element, drawing: { ...drawing, name: tableName(element.label ?? "") } };
  });
  const isTable = ({ element }: (typeof drawn)[number]) =>
    SEATED.has(element.shape) && !element.fixed;
  return {
    widthCm: layout.plan.widthCm,
    depthCm: layout.plan.depthCm,
    outline: layout.plan.outline,
    fixed: layout.plan.elements.map((element) => storedToDrawing({ element })),
    tables: drawn.filter(isTable).map(({ element, drawing }) => ({ id: element.id, drawing })),
    others: drawn.filter((one) => !isTable(one)).map(({ drawing }) => drawing),
  };
}

export type SlotTimesInput = {
  sitting: { first: number; last: number; slot: number };
  date: string;
  timeZone: string;
};

/** The sitting's start times of the day as instants with their `HH:mm` labels. */
export function slotTimes({ sitting, date, timeZone }: SlotTimesInput) {
  const times: { ms: number; label: string }[] = [];
  for (let minute = sitting.first; minute <= sitting.last; minute += sitting.slot) {
    const label = minuteToTime({ minute });
    times.push({ ms: atTime({ day: date, time: label, timeZone }).getTime(), label });
  }
  return times;
}
