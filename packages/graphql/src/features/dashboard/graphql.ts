import {
  type Attention,
  type BookedAheadMonth,
  BookedAheadMonthSchema,
  type DashboardSummary,
  dashboardSummary,
  type ExpiringHold,
  ExpiringHoldSchema,
  OverdueSchema,
  type Scheduled,
  ScheduledSchema,
  type StatusTileSchema,
  type UnsentWorkOrder,
  UnsentWorkOrderSchema,
  UtilisationSchema,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { TrendRef } from "../../schema/trend";

type StatusTile = z.infer<typeof StatusTileSchema>;
type Utilisation = z.infer<typeof UtilisationSchema>;
type Overdue = z.infer<typeof OverdueSchema>;

const StatusTileRef = builder.objectRef<StatusTile>("DashboardStatusTile").implement({
  description: "Open tickets in one status now, with their value and trend over the range.",
  fields: (t) => ({
    statusId: t.exposeString("statusId"),
    name: t.exposeString("name"),
    color: t.exposeString("color"),
    tickets: t.exposeInt("tickets"),
    estimatedValueMinor: t.exposeInt("estimatedValueMinor", { nullable: true }),
    confirmedValueMinor: t.exposeInt("confirmedValueMinor", { nullable: true }),
    trend: t.field({ type: TrendRef, resolve: (tile) => tile.trend }),
  }),
});
const ExpiringHoldRef = objectFromSchema<ExpiringHold>({
  name: "DashboardExpiringHold",
  schema: ExpiringHoldSchema,
  description: "A ticket whose expiring holds run out within 7 days.",
});
const UnsentWorkOrderRef = objectFromSchema<UnsentWorkOrder>({
  name: "DashboardUnsentWorkOrder",
  schema: UnsentWorkOrderSchema,
  description: "The newest version of a work order that is not sent, for an upcoming ticket.",
});
const OverdueRef = objectFromSchema<Overdue>({
  name: "DashboardOverdue",
  schema: OverdueSchema,
  description: "Sent invoices past their due date with money open.",
});
const ScheduledRef = objectFromSchema<Scheduled>({
  name: "DashboardScheduled",
  schema: ScheduledSchema,
  description: "An open ticket with lines starting within the range.",
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
    unsentWorkOrders: t.field({
      type: [UnsentWorkOrderRef],
      nullable: true,
      resolve: (a) => a.unsentWorkOrders,
    }),
    overdue: t.field({ type: OverdueRef, nullable: true, resolve: (a) => a.overdue }),
  }),
});

const DashboardSummaryRef = builder.objectRef<DashboardSummary>("DashboardSummary").implement({
  description:
    "The Workload tab of the dashboard for a range (ADR 0086). Parts the caller may not read are null.",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    currency: t.exposeString("currency"),
    timeZone: t.exposeString("timeZone"),
    bucketSize: t.exposeString("bucketSize"),
    statuses: t.field({ type: [StatusTileRef], resolve: (s) => s.statuses }),
    attention: t.field({ type: AttentionRef, resolve: (s) => s.attention }),
    scheduled: t.field({ type: [ScheduledRef], resolve: (s) => s.scheduled }),
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
