import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { nowOf } from "../../time/now";
import { parseIsoDate } from "../../time/plain-date";
import { bucketsOf } from "../../trend/buckets";
import { resolvePeriod } from "../finance/period";
import { attention } from "./attention";
import { bookedAhead } from "./booked-ahead";
import { resolveHorizon } from "./horizon";
import { scheduled } from "./scheduled";
import { DashboardSummaryInputSchema, DashboardSummarySchema } from "./schema";
import { statusTiles } from "./status-tiles";
import { statusTrends } from "./status-trends";
import { utilisation } from "./utilisation";

/**
 * The Workload tab (ADR 0079, 0080, 0086): open tickets per status now with their trend over the
 * range, what needs attention now, the tickets scheduled in the range, utilisation per bookable
 * item type and accepted quotes not invoiced by event month in the range. A view read model
 * (ADR 0071): each part from another feature needs that feature's `read`.
 */
export const dashboardSummary = defineOperation({
  name: "dashboard.summary",
  kind: "query",
  description:
    "The Workload tab of the dashboard for a range: open tickets and their estimated and confirmed value per ticket status now, " +
    "with the count's trend over the range; what needs attention now (holds expiring within 7 days, unsent sheets for tickets " +
    "in the next 28 days, overdue invoices); tickets with lines in the range; utilisation (booked over open hours) per bookable " +
    "item type over the range; and accepted quotes not invoiced yet per event month in the range. Unsent sheets are null " +
    "without sheet:read, overdue without finance:read and payment:read, utilisation without item:read, booked ahead without " +
    "quote:read. Money for the range (invoiced, received, won and lost) is finance.overview.",
  input: DashboardSummaryInputSchema,
  output: DashboardSummarySchema,
  permission: "ticket:read",
  entityType: "ticket",
  handler: async ({ input, context }) => {
    const resolved = await resolvePeriod({ context, input });
    if (!resolved.ok) return resolved;
    const period = resolved.value;
    const now = nowOf({ context });
    const range = {
      from: parseIsoDate({ value: input.from }),
      to: parseIsoDate({ value: input.to }),
    };
    const { size, buckets } = bucketsOf({ ...range, timeZone: period.timeZone });
    const [horizon, trendOf] = await Promise.all([
      resolveHorizon({ context }),
      statusTrends({ context, buckets, now }),
    ]);
    const [statuses, needs, inRange, used, ahead] = await Promise.all([
      statusTiles({ context, trendOf }),
      attention({ context, horizon }),
      scheduled({ context, period }),
      canView({ context, feature: "item" }) ? utilisation({ context, period: input }) : null,
      canView({ context, feature: "quote" }) ? bookedAhead({ context, period }) : null,
    ]);
    return ok({
      value: {
        ...{ from: input.from, to: input.to, currency: DEFAULT_CURRENCY },
        ...{ timeZone: period.timeZone, bucketSize: size },
        ...{
          statuses,
          attention: needs,
          scheduled: inRange,
          utilisation: used,
          bookedAhead: ahead,
        },
      },
    });
  },
});

export const dashboardOperations = [dashboardSummary];
