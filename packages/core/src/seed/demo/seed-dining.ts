import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { updateBookingPage } from "../../features/booking-page/operations";
import { setDiningRoom } from "../../features/dining-room/operations";
import { setDiningServiceException } from "../../features/dining-service/exception-operations";
import { createDiningService } from "../../features/dining-service/operations";
import { createLayout } from "../../features/floor-plan/layout-operations";
import { getFloorPlan } from "../../features/floor-plan/plan-operations";
import { saveTableCombinations } from "../../features/table-combination/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { atDaysAhead } from "../../time/days-ahead";
import { nowOf } from "../../time/now";
import { toIsoDate, weekdayOf } from "../../time/plain-date";
import { toZonedParts } from "../../time/zoned-time";
import type { DemoConfig, DemoDining, DemoDiningService } from "./config-types";
import type { DemoRefs } from "./demo-refs";
import { demoTimeZones } from "./demo-time-zones";
import type { DemoCatalog } from "./seed-items";
import { seedDemoReservations } from "./seed-reservations";
import type { DemoOrg } from "./types";

export type SeedDiningInput = {
  context: ExecuteContext;
  org: DemoOrg;
  config: DemoConfig;
  catalog: DemoCatalog;
  refs: DemoRefs;
};

const fail = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "INTERNAL", message: `Demo dining: ${message}` }) });

const minuteOf = ({ time }: { time: string }): number => {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
};

type LayoutIds = ReadonlyMap<string, string>;

/** The room's layouts by name, with the copies of `tableLayout` made first. */
async function seedLayouts({
  context,
  itemId,
  dining,
}: {
  context: ExecuteContext;
  itemId: string;
  dining: DemoDining;
}): Promise<Result<{ ids: LayoutIds; tables: ReadonlyMap<string, string> }>> {
  const plan = await execute({ operation: getFloorPlan, input: { itemId }, context });
  if (!plan.ok) return plan;
  const source = plan.value.layouts.find((layout) => layout.name === dining.tableLayout);
  if (!source) return fail({ message: `no layout ${dining.tableLayout}` });
  const ids = new Map<string, string>(plan.value.layouts.map((layout) => [layout.name, layout.id]));
  for (const name of dining.copies) {
    const input = { itemId, name, copyFromId: source.id };
    const copy = await execute({ operation: createLayout, input, context });
    if (!copy.ok) return copy;
    ids.set(name, copy.value.id);
  }
  const tables = new Map<string, string>();
  for (const piece of source.elements) if (piece.label) tables.set(piece.label, piece.id);
  return ok({ value: { ids, tables } });
}

type ServiceInput = {
  context: ExecuteContext;
  itemId: string;
  service: DemoDiningService;
  layoutId: string;
  year: number;
};

async function seedService({ context, itemId, service, layoutId, year }: ServiceInput) {
  const input = {
    ...{ roomItemId: itemId, name: service.name, layoutId, weekdays: [...service.weekdays] },
    ...{ firstStartMinute: minuteOf({ time: service.first }) },
    ...{ lastStartMinute: minuteOf({ time: service.last }) },
    ...{ maxCoversPerSlot: service.maxCoversPerSlot, turnTimes: [...service.turnTimes] },
    ...{ depositFromParty: service.depositFromParty ?? null },
    ...{ depositPerCoverMinor: service.depositPerCoverMinor ?? null },
  };
  const created = await execute({ operation: createDiningService, input, context });
  if (!created.ok) return created;
  for (const exception of service.exceptions ?? []) {
    const date = toIsoDate({ date: { year, month: exception.month, day: exception.day } });
    // A sitting only runs on its weekdays, so an exception on another weekday would do nothing.
    const weekday = weekdayOf({ date: { year, month: exception.month, day: exception.day } });
    if (!service.weekdays.includes(weekday)) continue;
    const times =
      exception.first && exception.last
        ? {
            firstStartMinute: minuteOf({ time: exception.first }),
            lastStartMinute: minuteOf({ time: exception.last }),
          }
        : {};
    const body = {
      ...{ serviceId: created.value.id, date, closed: exception.closed ?? false, ...times },
      note: exception.note ?? null,
    };
    const set = await execute({ operation: setDiningServiceException, input: body, context });
    if (!set.ok) return set;
  }
  return ok({ value: true as const });
}

/**
 * ADR 0119: the restaurant room's layouts, table combinations, booking window, sittings with
 * their exceptions and the published booking page, through the dining operations as SYSTEM.
 */
export async function seedDemoDining({ config, ...rest }: SeedDiningInput): Promise<Result<true>> {
  for (const dining of config.dining ?? []) {
    const seeded = await seedDiningRoom({ ...rest, dining });
    if (!seeded.ok) return seeded;
  }
  return ok({ value: true });
}

type RoomInput = Omit<SeedDiningInput, "config"> & { dining: DemoDining };

async function seedDiningRoom({
  context,
  org,
  catalog,
  refs,
  dining,
}: RoomInput): Promise<Result<true>> {
  const itemId = catalog.items.get(dining.item);
  if (!itemId) return fail({ message: `unknown item ${dining.item}` });
  const layouts = await seedLayouts({ context, itemId, dining });
  if (!layouts.ok) return layouts;
  const { ids, tables } = layouts.value;
  const tableLayoutId = ids.get(dining.tableLayout);
  if (!tableLayoutId) return fail({ message: "no table layout" });
  const combinations = [];
  for (const combination of dining.combinations) {
    const elementIds = combination.tables.map((label) => tables.get(label));
    if (elementIds.some((id) => !id))
      return fail({ message: `unknown table in ${combination.name}` });
    const { tables: _tables, ...rest } = combination;
    combinations.push({ ...rest, elementIds: elementIds as string[] });
  }
  const saved = await execute({
    operation: saveTableCombinations,
    input: { layoutId: tableLayoutId, combinations },
    context,
  });
  if (!saved.ok) return saved;
  const timeZone = demoTimeZones({ org }).lines;
  const now = nowOf({ context });
  const nextDay = atDaysAhead({ now, days: dining.openDays + 1, time: "00:00", timeZone });
  const openUntil = new Date(nextDay.getTime() - 1);
  const room = await execute({
    operation: setDiningRoom,
    input: { itemId, slug: dining.slug, openUntil },
    context,
  });
  if (!room.ok) return room;
  const year = toZonedParts({ instant: now, timeZone }).date.year;
  for (const service of dining.services) {
    const layoutId = ids.get(service.layout);
    if (!layoutId) return fail({ message: `no layout ${service.layout}` });
    const seeded = await seedService({ context, itemId, service, layoutId, year });
    if (!seeded.ok) return seeded;
  }
  const { page } = dining;
  if (page) {
    const input = { ...page, slug: org.slug, published: true, embedOrigins: [] as string[] };
    const published = await execute({ operation: updateBookingPage, input, context });
    if (!published.ok) return published;
  }
  return seedDemoReservations({ context, dining, refs, itemId, tables, timeZone });
}
