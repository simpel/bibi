import { ok } from "../../errors/result";
import { DEFAULT_CURRENCY } from "../../number/number-formats";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { resolvePeriod } from "../finance/period";
import { outcomes } from "./outcomes";
import { DashboardSummaryInputSchema, DashboardSummarySchema } from "./schema";
import { statusTiles } from "./status-tiles";
import { utilisation } from "./utilisation";

/**
 * The dashboard (ADR 0079): open tickets per status now with their value, won and lost tickets per
 * month, and utilisation per bookable item type. A view read model (ADR 0071): outcomes need
 * `quote:read`, utilisation `item:read`. Money is `finance.overview`.
 */
export const dashboardSummary = defineOperation({
  name: "dashboard.summary",
  kind: "query",
  description:
    "The dashboard for a period: open tickets and their estimated and confirmed value per ticket status now, " +
    "tickets won (closed with an accepted quote or a sent invoice) and lost per month, and utilisation (booked over open hours) " +
    "per bookable item type. Outcomes are null without quote:read, utilisation without item:read.",
  input: DashboardSummaryInputSchema,
  output: DashboardSummarySchema,
  permission: "ticket:read",
  entityType: "ticket",
  handler: async ({ input, context }) => {
    const resolved = await resolvePeriod({ context, input });
    if (!resolved.ok) return resolved;
    const period = resolved.value;
    const [statuses, won, used] = await Promise.all([
      statusTiles({ context }),
      canView({ context, feature: "quote" }) ? outcomes({ context, period }) : null,
      canView({ context, feature: "item" }) ? utilisation({ context, period: input }) : null,
    ]);
    return ok({
      value: {
        from: input.from,
        to: input.to,
        currency: DEFAULT_CURRENCY,
        timeZone: period.timeZone,
        statuses,
        outcomes: won,
        utilisation: used,
      },
    });
  },
});

export const dashboardOperations = [dashboardSummary];
