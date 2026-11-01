import {
  type Attention,
  type BookedAheadMonth,
  BookedAheadMonthSchema,
  type ComingUp,
  ComingUpSchema,
  type DashboardSummary,
  dashboardSummary,
  type ExpiringHold,
  ExpiringHoldSchema,
  OverdueSchema,
  StatusTileSchema,
  type UnsentSheet,
  UnsentSheetSchema,
  UtilisationSchema,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type StatusTile = z.infer<typeof StatusTileSchema>;
type Utilisation = z.infer<typeof UtilisationSchema>;
type Overdue = z.infer<typeof OverdueSchema>;

const StatusTileRef = objectFromSchema<StatusTile>({
  name: "DashboardStatusTile",
  schema: StatusTileSchema,
  description: "Open tickets in one status now, with their value.",
});
const ExpiringHoldRef = objectFromSchema<ExpiringHold>({
  name: "DashboardExpiringHold",
  schema: ExpiringHoldSchema,
  description: "A ticket whose expiring holds run out within 7 days.",
});
const UnsentSheetRef = objectFromSchema<UnsentSheet>({
  name: "DashboardUnsentSheet",
  schema: UnsentSheetSchema,
  description: "The newest version of a sheet that is not sent, for an upcoming ticket.",
});
const OverdueRef = objectFromSchema<Overdue>({
  name: "DashboardOverdue",
  schema: OverdueSchema,
  description: "Sent invoices past their due date with money open.",
});
const ComingUpRef = objectFromSchema<ComingUp>({
  name: "DashboardComingUp",
  schema: ComingUpSchema,
  description: "An open ticket with lines starting within the horizon.",
});
const UtilisationRef = objectFromSchema<Utilisation>({
  name: "DashboardUtilisation",
  schema: UtilisationSchema,
  description: "Booked over open hours for one item type.",
});
const BookedAheadRef = objectFromSchema<BookedAheadMonth>({
  name: "DashboardBookedAheadMonth",
  schema: BookedAheadMonthSchema,
  description: "Accepted quotes not invoiced yet, by the event's month.",
});

const AttentionRef = builder.objectRef<Attention>("DashboardAttention").implement({
  description: "What needs attention (ADR 0080). Parts the caller may not read are null.",
  fields: (t) => ({
    expiringHolds: t.field({ type: [ExpiringHoldRef], resolve: (a) => a.expiringHolds }),
    unsentSheets: t.field({
      type: [UnsentSheetRef],
      nullable: true,
      resolve: (a) => a.unsentSheets,
    }),
    overdue: t.field({ type: OverdueRef, nullable: true, resolve: (a) => a.overdue }),
  }),
});

const DashboardSummaryRef = builder.objectRef<DashboardSummary>("DashboardSummary").implement({
  description:
    "The dashboard for today and the next 28 days (ADR 0080). Parts the caller may not read are null.",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    currency: t.exposeString("currency"),
    timeZone: t.exposeString("timeZone"),
    statuses: t.field({ type: [StatusTileRef], resolve: (s) => s.statuses }),
    attention: t.field({ type: AttentionRef, resolve: (s) => s.attention }),
    comingUp: t.field({ type: [ComingUpRef], resolve: (s) => s.comingUp }),
    utilisation: t.field({
      type: [UtilisationRef],
      nullable: true,
      resolve: (s) => s.utilisation,
    }),
    bookedAhead: t.field({
      type: [BookedAheadRef],
      nullable: true,
      resolve: (s) => s.bookedAhead,
    }),
  }),
});

fieldFromOperation({
  operation: dashboardSummary,
  type: DashboardSummaryRef,
  name: "dashboardSummary",
});
