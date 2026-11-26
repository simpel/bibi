import { getBookingPage } from "../../features/booking-page/operations";
import { listDiningRooms } from "../../features/dining-room/operations";
import { listDiningServices } from "../../features/dining-service/operations";
import { getLayout } from "../../features/floor-plan/layout-operations";
import { getFloorPlan } from "../../features/floor-plan/plan-operations";
import { listItems } from "../../features/item/read-operations";
import { listReservations } from "../../features/reservation/read-operations";
import { listTableCombinations } from "../../features/table-combination/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoDining } from "./config-types";
import type { DemoOrg } from "./types";

export type CheckDiningInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0119: the restaurant room is set up for table booking with its tables, combinations and
 * sittings, and the booking page is published. Returns failure messages.
 */
export async function checkDemoDining({ context, org }: CheckDiningInput): Promise<string[]> {
  const failures: string[] = [];
  for (const dining of org.config.dining ?? []) {
    failures.push(...(await checkRoom({ context, org, dining })));
  }
  return failures;
}

async function checkRoom({
  context,
  org,
  dining,
}: CheckDiningInput & { dining: DemoDining }): Promise<string[]> {
  const failures: string[] = [];
  const drawn = org.config.floorPlans
    ?.find((plan) => plan.item === dining.item)
    ?.layouts.find((layout) => layout.name === dining.tableLayout)
    ?.pieces.filter((piece) => piece.label);
  const expectedTables = drawn?.length ?? 0;
  const expectedOffline = (drawn ?? [])
    .filter((piece) => piece.onlineBookable === false)
    .map((piece) => piece.label)
    .sort()
    .join();
  const items = await execute({
    operation: listItems,
    input: { capability: "SETUPS", limit: 100 },
    context,
  });
  const itemId = items.ok ? items.value.items.find((item) => item.name === dining.item)?.id : null;
  if (!itemId) return [`${org.slug}: no dining room item ${dining.item}`];
  const rooms = await execute({ operation: listDiningRooms, input: {}, context });
  const room = rooms.ok ? rooms.value.items.find((candidate) => candidate.itemId === itemId) : null;
  if (!room || room.slug !== dining.slug)
    failures.push(`${org.slug}: ${dining.item} is no dining room`);
  if (!room?.openUntil || room.openUntil <= new Date()) {
    failures.push(`${org.slug}: ${dining.item} is not open for booking`);
  }
  const plan = await execute({ operation: getFloorPlan, input: { itemId }, context });
  const summary = plan.ok
    ? plan.value.layouts.find((layout) => layout.name === dining.tableLayout)
    : null;
  const layout = summary
    ? await execute({ operation: getLayout, input: { id: summary.id }, context })
    : null;
  const tables = layout?.ok ? layout.value.elements.filter((element) => element.label) : [];
  if (tables.length !== expectedTables) {
    failures.push(
      `${org.slug}: ${dining.item} has ${tables.length} tables, expected ${expectedTables}`,
    );
  }
  const offline = tables.filter((table) => !table.onlineBookable).map((table) => table.label);
  if (offline.sort().join() !== expectedOffline) {
    failures.push(`${org.slug}: ${dining.item} tables not online are ${offline.join(",")}`);
  }
  const combinations = summary
    ? await execute({ operation: listTableCombinations, input: { layoutId: summary.id }, context })
    : null;
  const combinationCount = combinations?.ok ? combinations.value.items.length : 0;
  if (combinationCount !== dining.combinations.length) {
    failures.push(`${org.slug}: ${combinationCount} table combinations`);
  }
  const services = await execute({
    operation: listDiningServices,
    input: { roomItemId: itemId },
    context,
  });
  const serviceCount = services.ok ? services.value.items.length : 0;
  if (serviceCount !== dining.services.length)
    failures.push(`${org.slug}: ${serviceCount} sittings`);
  const page = await execute({ operation: getBookingPage, input: {}, context });
  if (dining.page && (!page.ok || !page.value.published || page.value.slug !== org.slug)) {
    failures.push(`${org.slug}: the booking page is not published`);
  }
  const day = 86_400_000;
  const reservations = await execute({
    operation: listReservations,
    input: {
      ...{ roomItemId: itemId, from: new Date(Date.now() - 2 * day) },
      ...{
        to: new Date(Date.now() + 9 * day),
        states: ["BOOKED", "SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"],
      },
    },
    context,
  });
  const states = new Set(reservations.ok ? reservations.value.items.map((item) => item.state) : []);
  const count = reservations.ok ? reservations.value.items.length : 0;
  const least = dining.reservations.outcomes ? 20 : 8;
  if (count < least) failures.push(`${org.slug}: ${dining.item} has ${count} reservations`);
  for (const state of dining.reservations.outcomes
    ? (["SEATED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const)
    : []) {
    if (!states.has(state)) failures.push(`${org.slug}: no ${state} reservation`);
  }
  return failures;
}
