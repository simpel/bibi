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
    "What stands in the way of a saved order's lines or warns about them now, by the same " +
    "checks as order.previewLines (ADR 0081), each line judged in its own item state: " +
    "HARD_CLASH (another order's hard hold, a buffer or a manual block on the item, with that " +
    "order's reference and period), SOFT_OVERLAP (another order's soft hold), SELF_OVERLAP " +
    "(two of the order's lines hold one item at once), SETUP_CAPACITY, POOL_SHORT and " +
    "OUTSIDE_HOURS. The order's own holds never count against it; the other order's reference " +
    "needs order:read. Only lines with issues come " +
    "back. Availability needs item:read; without it `availabilityHidden` is true and only " +
    "SELF_OVERLAP is checked. Writes nothing.",
  input: LineIssuesInputSchema,
  output: LineIssuesOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const order = await context.db.order.findFirst({
      where: { id: input.orderId },
      select: { id: true, statusId: true },
    });
    if (!order) return notFound({ entity: "Order" });
    const rows = await context.db.line.findMany({
      where: { orderId: order.id },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }, { id: "asc" }],
      include: LINE_INCLUDE,
    });
    const lines = await withEffective({ context, lines: rows.map((row) => toLineRecord({ row })) });
    const withAvailability = canView({ context, feature: "item" });
    const found = await savedLineIssues({
      ...{ context, statusId: order.statusId, lines, withAvailability },
    });
    // Another order's reference and title are the order feature's (ADR 0050): only with order:read.
    const references = canView({ context, feature: "order" });
    const issues = found.map((line) => ({
      ...line,
      issues: line.issues.map((issue) =>
        references ? issue : { ...issue, orderReference: null, orderTitle: null },
      ),
    }));
    return ok({ value: { availabilityHidden: !withAvailability, lines: issues } });
  },
});
