import { type LayoutDto, parseIsoDate, weekdayOf } from "@bibi/core/schemas";
import { storedToDrawing } from "@/features/floor-plan/lib/to-drawing";
import { minuteToTime } from "../../table-booking/lib/clock";
import { atTime } from "../../table-booking/lib/edge-time";
import type { RoomTables } from "../load-reservation-data";
import type { FloorPlanData } from "../ui/floor-plan-panel";

const SEATED = new Set(["ROUND", "RECT"]);

export type FloorSittingInput = { sittings: RoomTables["sittings"]; date: string };

/** The sitting the floor shows: one that runs that weekday, else the first. */
export function floorSitting({ sittings, date }: FloorSittingInput) {
  const weekday = weekdayOf({ date: parseIsoDate({ value: date }) });
  return sittings.find((sitting) => sitting.weekdays.includes(weekday)) ?? sittings[0] ?? null;
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
