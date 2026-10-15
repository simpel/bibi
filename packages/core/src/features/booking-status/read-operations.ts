import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadBookingStatus, toBookingStatusDto, WITH_TRANSITIONS } from "./load-booking-status";
import {
  BookingStatusIdInputSchema,
  BookingStatusListInputSchema,
  BookingStatusListOutputSchema,
  BookingStatusSchema,
} from "./schema";

export const listBookingStatuses = defineOperation({
  name: "bookingStatus.list",
  kind: "query",
  description:
    "List the organization's booking statuses in order, each with its fixed phase " +
    "(TENTATIVE, CONFIRMED, COMPLETED, CANCELLED) and the statuses a booking may move to " +
    "from it (`transitionsTo`). The first status of a phase is that phase's default.",
  input: BookingStatusListInputSchema,
  output: BookingStatusListOutputSchema,
  permission: "bookingStatus:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.bookingStatus.findMany({
      orderBy: [{ position: "asc" }, { id: "asc" }],
      include: WITH_TRANSITIONS,
      ...pageArgs(input),
    });
    const statuses = rows.map((row) => toBookingStatusDto({ row }));
    return ok({ value: paginate({ rows: statuses, limit: input.limit }) });
  },
});

export const getBookingStatus = defineOperation({
  name: "bookingStatus.get",
  kind: "query",
  description: "Get one booking status by id, with the statuses it may move to.",
  input: BookingStatusIdInputSchema,
  output: BookingStatusSchema,
  permission: "bookingStatus:read",
  handler: async ({ input, context }) => {
    const status = await loadBookingStatus({ context, id: input.id });
    return status ? ok({ value: status }) : notFound({ entity: "Booking status" });
  },
});
