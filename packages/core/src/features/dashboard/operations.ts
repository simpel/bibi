import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { attention } from "./attention";
import { bookedAhead } from "./booked-ahead";
import { comingUp } from "./coming-up";
import { resolveHorizon } from "./horizon";
import { DashboardSummaryInputSchema, DashboardSummarySchema } from "./schema";
import { statusTiles } from "./status-tiles";
import { utilisation } from "./utilisation";

/**
 * The dashboard (ADR 0079, 0080): open tickets per status now with their value, what needs
 * attention, what is coming up, utilisation per bookable item type and accepted quotes not
 * invoiced, over today and the next 28 days. A view read model (ADR 0071): each part from
 * another feature needs that feature's `read`. The past is `finance.overview`.
 */
export const dashboardSummary = defineOperation({
  name: "dashboard.summary",
  kind: "query",
  description:
    "The dashboard for today and the next 28 days: open tickets and their estimated and confirmed value per ticket status, " +
    "what needs attention (holds expiring within 7 days, unsent sheets for upcoming tickets, overdue invoices), tickets coming up, " +
    "utilisation (booked over open hours) per bookable item type, and accepted quotes not invoiced yet per event month. " +
    "Unsent sheets are null without sheet:read, overdue without finance:read and payment:read, utilisation without item:read, " +
    "booked ahead without quote:read. Past periods (invoiced, received, won and lost) are finance.overview.",
  input: DashboardSummaryInputSchema,
  output: DashboardSummarySchema,
  permission: "ticket:read",
  entityType: "ticket",
  handler: async ({ context }) => {
    const horizon = await resolveHorizon({ context });
    const window = { from: horizon.from, to: horizon.to };
    const [statuses, needs, upcoming, used, ahead] = await Promise.all([
      statusTiles({ context }),
      attention({ context, horizon }),
      comingUp({ context, horizon }),
      canView({ context, feature: "item" }) ? utilisation({ context, period: window }) : null,
      canView({ context, feature: "quote" })
        ? bookedAhead({ context, monthOf: horizon.monthOf })
        : null,
    ]);
    return ok({
      value: {
        ...window,
        currency: DEFAULT_CURRENCY,
        timeZone: horizon.timeZone,
        statuses,
        attention: needs,
        comingUp: upcoming,
        utilisation: used,
        bookedAhead: ahead,
      },
    });
  },
});

export const dashboardOperations = [dashboardSummary];
