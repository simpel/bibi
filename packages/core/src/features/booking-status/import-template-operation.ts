import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import type { BookingStatusTemplate } from "../../templates/booking-statuses/booking-status-template";
import { getBookingStatusTemplate } from "../../templates/booking-statuses/booking-status-templates";
import { bookingStatusNameTaken, insertBookingStatus } from "./insert-booking-status";
import { loadAllBookingStatuses } from "./load-booking-status";
import {
  type BookingStatusDto,
  type BookingStatusImportResult,
  BookingStatusImportTemplateInputSchema,
  BookingStatusImportTemplateOutputSchema,
} from "./schema";

type TemplateInput = { context: OperationContext; template: BookingStatusTemplate };

type RecordInput = { context: OperationContext; before: BookingStatusDto[] };

/** Audits every status whose allowed targets changed; returns the statuses as they are now. */
async function recordTransitionChanges({ context, before }: RecordInput) {
  const after = await loadAllBookingStatuses({ context });
  for (const status of after) {
    const previous = before.find((candidate) => candidate.id === status.id);
    if (previous && previous.transitionsTo.join() === status.transitionsTo.join()) continue;
    context.recordChange({ entityId: status.id, before: previous, after: status });
  }
  return after;
}

/** Adds the template's transitions between the active statuses with its names; keeps the rest. */
async function addTransitions({ context, template }: TemplateInput) {
  const before = await loadAllBookingStatuses({ context });
  const idOf = new Map(before.map((status) => [status.name, status.id]));
  const data = template.transitions.flatMap(([from, to]) => {
    const fromStatusId = idOf.get(from);
    const toStatusId = idOf.get(to);
    if (!fromStatusId || !toStatusId) return [];
    return [{ organizationId: context.organizationId, fromStatusId, toStatusId }];
  });
  const added = await context.db.bookingStatusTransition.createMany({ data, skipDuplicates: true });
  return { count: added.count, statuses: await recordTransitionChanges({ context, before }) };
}

/** Shared by `bookingStatus.importTemplate` and organization provisioning. */
export async function importBookingStatuses({
  context,
  template,
}: TemplateInput): Promise<Result<BookingStatusImportResult>> {
  const created = [];
  const skipped: string[] = [];
  for (const status of template.statuses) {
    if (await bookingStatusNameTaken({ context, name: status.name })) {
      skipped.push(status.name);
      continue;
    }
    const inserted = await insertBookingStatus({ context, ...status });
    if (!inserted.ok) return inserted;
    created.push(inserted.value);
  }
  const added = await addTransitions({ context, template });
  const withTransitions = created.map(
    (status) => added.statuses.find((candidate) => candidate.id === status.id) ?? status,
  );
  return ok({ value: { created: withTransitions, skipped, transitionsAdded: added.count } });
}

export const importBookingStatusTemplate = defineOperation({
  name: "bookingStatus.importTemplate",
  kind: "command",
  description:
    "Import a booking status template as ordinary, editable statuses with their transitions. " +
    "Statuses whose name already exists are skipped; the template's transitions between " +
    "statuses with its names are added, existing transitions are kept.",
  input: BookingStatusImportTemplateInputSchema,
  output: BookingStatusImportTemplateOutputSchema,
  permission: "bookingStatus:admin",
  handler: ({ input, context }) =>
    importBookingStatuses({ context, template: getBookingStatusTemplate({ key: input.template }) }),
});
