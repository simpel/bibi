import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { checkReadable } from "../order/order-rules";
import {
  ITEM_SUMMARY_SAMPLE_SIZE,
  ItemSummaryInputSchema,
  ItemSummaryOutputSchema,
} from "./summary-schema";

export const summarizeItems = defineOperation({
  name: "item.summary",
  kind: "query",
  description:
    "Count a venue's items (artiklar) per item type, with the first few names of each type. " +
    "Answers 'what does this venue have?' without listing every item; use item.list with " +
    "venueId and entityTypeId for the items themselves.",
  input: ItemSummaryInputSchema,
  output: ItemSummaryOutputSchema,
  permission: "item:read",
  handler: async ({ input, context }) => {
    const readable = checkReadable({ context, permission: "venue:read", path: "venueId" });
    if (!readable.ok) return readable;
    const venue = await context.db.venue.findFirst({ where: { id: input.venueId } });
    if (!venue) return notFound({ entity: "Venue" });
    const where = { venueId: input.venueId, customerId: null, status: "ACTIVE" as const };
    const groups = await context.db.item.groupBy({
      by: ["entityTypeId"],
      where,
      _count: { _all: true },
      orderBy: [{ _count: { entityTypeId: "desc" } }, { entityTypeId: "asc" }],
    });
    // One small read per type: an organization has a handful of item types, not hundreds.
    const samples = await Promise.all(
      groups.map(({ entityTypeId }) =>
        context.db.item.findMany({
          where: { ...where, entityTypeId },
          select: { name: true },
          orderBy: [{ name: "asc" }, { id: "asc" }],
          take: ITEM_SUMMARY_SAMPLE_SIZE,
        }),
      ),
    );
    const types = groups.map((group, index) => ({
      entityTypeId: group.entityTypeId,
      count: group._count._all,
      sampleNames: (samples[index] ?? []).map((row) => row.name),
    }));
    const total = types.reduce((sum, type) => sum + type.count, 0);
    return ok({ value: { total, types } });
  },
});
