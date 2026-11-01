import {
  type DashboardSummary,
  dashboardSummary,
  OutcomeMonthSchema as OutcomeSchema,
  StatusTileSchema,
  UtilisationSchema,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type StatusTile = z.infer<typeof StatusTileSchema>;
type OutcomeMonth = z.infer<typeof OutcomeSchema>;
type Utilisation = z.infer<typeof UtilisationSchema>;

const StatusTileRef = objectFromSchema<StatusTile>({
  name: "DashboardStatusTile",
  schema: StatusTileSchema,
  description: "Open tickets in one status now, with their value.",
});
const OutcomeRef = objectFromSchema<OutcomeMonth>({
  name: "DashboardOutcomeMonth",
  schema: OutcomeSchema,
  description: "Tickets won and lost in one month.",
});
const UtilisationRef = objectFromSchema<Utilisation>({
  name: "DashboardUtilisation",
  schema: UtilisationSchema,
  description: "Booked over open hours for one item type.",
});

const DashboardSummaryRef = builder.objectRef<DashboardSummary>("DashboardSummary").implement({
  description: "The dashboard for a period (ADR 0079). Parts the caller may not read are null.",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    currency: t.exposeString("currency"),
    timeZone: t.exposeString("timeZone"),
    statuses: t.field({ type: [StatusTileRef], resolve: (s) => s.statuses }),
    outcomes: t.field({ type: [OutcomeRef], nullable: true, resolve: (s) => s.outcomes }),
    utilisation: t.field({
      type: [UtilisationRef],
      nullable: true,
      resolve: (s) => s.utilisation,
    }),
  }),
});

fieldFromOperation({
  operation: dashboardSummary,
  type: DashboardSummaryRef,
  name: "dashboardSummary",
});
