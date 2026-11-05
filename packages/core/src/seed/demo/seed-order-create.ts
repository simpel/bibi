import type { OrderCreateInput } from "../../features/order/schema";
import { createOrder } from "../../features/order/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { addDays } from "../../time/plain-date";
import { fromZonedParts, toZonedParts } from "../../time/zoned-time";
import type { DemoTimeZones } from "./demo-time-zones";
import { demoTitle } from "./demo-title";
import type { DemoOrder } from "./order-types";
import { createDemoOrderFromTemplate } from "./seed-order-from-template";

type AtInput = { now: Date; day: number; time: string; timeZone: string };

/** D + `day` at the local time `HH:MM` in `timeZone`. */
export function at({ now, day, time, timeZone }: AtInput): Date {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  const today = toZonedParts({ instant: now, timeZone }).date;
  const date = addDays({ date: today, days: day });
  return fromZonedParts({ date, time: { hour, minute, second: 0 }, timeZone });
}

type PeriodInput = { order: DemoOrder; now: Date; timeZone: string };

/** The desired period on the order's day and, for leads with soft holds, `holdsUntil`. */
function periodOf({ order, now, timeZone }: PeriodInput) {
  const holdsUntil =
    order.holdsUntilDay === undefined
      ? {}
      : { holdsUntil: at({ now, day: order.holdsUntilDay, time: "23:59", timeZone }) };
  return {
    desiredStartsAt: at({ now, day: order.day, time: order.from, timeZone }),
    desiredEndsAt: at({ now, day: order.day, time: order.to, timeZone }),
    ...holdsUntil,
  };
}

type CreateOneInput = {
  context: ExecuteContext;
  order: DemoOrder;
  typeId: string;
  party: { customerId: string; contactId: string; assigneeId: string | null };
  fields: OrderCreateInput["fields"];
  now: Date;
  zones: DemoTimeZones;
  lineAt: (input: { time: string }) => Date;
};

/** The order, from its predefined order or through `order.create`, named by `demoTitle`. */
export async function createOne({
  context,
  order,
  typeId,
  party,
  fields,
  now,
  zones,
  lineAt,
}: CreateOneInput) {
  const title = demoTitle({ order });
  if (order.template) {
    return createDemoOrderFromTemplate({
      ...{ context, template: order.template, ...party, title },
      ...{ startsAt: lineAt({ time: order.from }), headcount: order.headcount },
    });
  }
  const input = {
    ...{ entityTypeId: typeId, ...party, note: order.note, title, fields },
    ...periodOf({ order, now, timeZone: zones.order }),
    estimatedHeadcount: order.headcount,
  };
  return execute({ operation: createOrder, input, context });
}
