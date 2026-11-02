import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { notFound } from "../../shared/errors";
import { LineIssuesInputSchema, LineIssuesOutputSchema } from "./issues-schema";
import { savedLineIssues } from "./saved-line-issues";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";
import { withEffective } from "./with-effective";

export const lineIssues = defineOperation({
  name: "line.issues",
  kind: "query",
  description:
    "What stands in the way of a saved ticket's lines or warns about them now, by the same " +
    "checks as ticket.previewLines (ADR 0081), each line judged in its own item state: " +
    "HARD_CLASH (another ticket's hard hold, a buffer or a manual block on the item, with that " +
    "ticket's reference and period), SOFT_OVERLAP (another ticket's soft hold), SELF_OVERLAP " +
    "(two of the ticket's lines hold one item at once), SETUP_CAPACITY, POOL_SHORT and " +
    "OUTSIDE_HOURS. The ticket's own holds never count against it; the other ticket's reference " +
    "needs ticket:read. Only lines with issues come " +
    "back. Availability needs item:read; without it `availabilityHidden` is true and only " +
    "SELF_OVERLAP is checked. Writes nothing.",
  input: LineIssuesInputSchema,
  output: LineIssuesOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const ticket = await context.db.ticket.findFirst({
      where: { id: input.ticketId },
      select: { id: true, statusId: true },
    });
    if (!ticket) return notFound({ entity: "Ticket" });
    const rows = await context.db.line.findMany({
      where: { ticketId: ticket.id },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: LINE_INCLUDE,
    });
    const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
    const withAvailability = canView({ context, feature: "item" });
    const found = await savedLineIssues({
      ...{ context, statusId: ticket.statusId, lines, withAvailability },
    });
    // Another ticket's reference is the ticket feature's (ADR 0050): only with ticket:read.
    const references = canView({ context, feature: "ticket" });
    const issues = found.map((line) => ({
      ...line,
      issues: line.issues.map((issue) =>
        references ? issue : { ...issue, ticketReference: null },
      ),
    }));
    return ok({ value: { availabilityHidden: !withAvailability, lines: issues } });
  },
});
