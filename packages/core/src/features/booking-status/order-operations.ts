import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid, notFound } from "../../shared/errors";
import { loadAllBookingStatuses, loadBookingStatus } from "./load-booking-status";
import {
  BOOKING_PHASES,
  type BookingStatusDto,
  BookingStatusListOutputSchema,
  BookingStatusReorderInputSchema,
  BookingStatusSchema,
  BookingStatusSetTransitionsInputSchema,
} from "./schema";

type CheckOrderInput = { ids: readonly string[]; current: readonly BookingStatusDto[] };

/** The problem with a proposed order, or `null`: every active status once, phases kept in order. */
function orderProblem({ ids, current }: CheckOrderInput): string | null {
  const byId = new Map(current.map((status) => [status.id, status]));
  const complete = ids.length === current.length && new Set(ids).size === ids.length;
  if (!complete || ids.some((id) => !byId.has(id))) {
    return "List every active booking status exactly once";
  }
  const phases = ids.flatMap((id) => {
    const status = byId.get(id);
    return status ? [BOOKING_PHASES.indexOf(status.phase)] : [];
  });
  const grouped = phases.every((phase, index) => phase >= (phases[index - 1] ?? 0));
  return grouped ? null : "Statuses must stay grouped by phase, in phase order";
}

export const reorderBookingStatuses = defineOperation({
  name: "bookingStatus.reorder",
  kind: "command",
  description:
    "Set the order of the booking statuses: pass every active status id in the new order. " +
    "Phases stay in lifecycle order (TENTATIVE, CONFIRMED, COMPLETED, CANCELLED); within a " +
    "phase the first status becomes the phase's default.",
  input: BookingStatusReorderInputSchema,
  output: BookingStatusListOutputSchema,
  permission: "bookingStatus:admin",
  // Each moved status is audited as a bookingStatus change.
  entityType: "bookingStatus",
  handler: async ({ input: { ids }, context }) => {
    const current = await loadAllBookingStatuses({ context });
    const problem = orderProblem({ ids, current });
    if (problem) return invalid({ message: problem, issues: [{ path: "ids", message: problem }] });
    for (const [position, id] of ids.entries()) {
      const before = current.find((status) => status.id === id);
      if (!before || before.position === position) continue;
      await context.db.bookingStatus.update({ where: { id }, data: { position } });
      context.recordChange({ entityId: id, before, after: { ...before, position } });
    }
    return ok({ value: { items: await loadAllBookingStatuses({ context }), nextCursor: null } });
  },
});

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "toStatusIds", message }] });

export const setBookingStatusTransitions = defineOperation({
  name: "bookingStatus.setTransitions",
  kind: "command",
  description:
    "Replace the statuses a booking may move to from one status (from → to). Pass the full " +
    "set; an empty list makes the status a dead end. A CANCELLED-phase status is always a dead " +
    "end (ADR 0022). The phase rules (ADR 0022) still apply " +
    "to every allowed transition.",
  input: BookingStatusSetTransitionsInputSchema,
  output: BookingStatusSchema,
  permission: "bookingStatus:admin",
  handler: async ({ input: { id, toStatusIds }, context }) => {
    const before = await loadBookingStatus({ context, id });
    if (!before) return notFound({ entity: "Booking status" });
    const targets = [...new Set(toStatusIds)];
    if (before.phase === "CANCELLED" && targets.length > 0) {
      return problem({
        message: "A status in the CANCELLED phase is terminal: no transitions out",
      });
    }
    if (targets.includes(id)) return problem({ message: "A status cannot move to itself" });
    const found = await context.db.bookingStatus.count({ where: { id: { in: targets } } });
    if (found !== targets.length) return problem({ message: "Unknown or archived target status" });
    await context.db.bookingStatusTransition.deleteMany({ where: { fromStatusId: id } });
    await context.db.bookingStatusTransition.createMany({
      data: targets.map((toStatusId) => ({
        organizationId: context.organizationId,
        fromStatusId: id,
        toStatusId,
      })),
    });
    const after = await loadBookingStatus({ context, id });
    if (!after) return notFound({ entity: "Booking status" });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
