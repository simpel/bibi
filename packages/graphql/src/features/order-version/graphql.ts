import {
  getOrderVersion,
  listOrderVersions,
  nameOrderVersion,
  type OrderVersionDetail,
  OrderVersionDetailSchema,
  type OrderVersionDto,
  type OrderVersionList,
  OrderVersionSchema,
  restoreOrderVersion,
  type VersionChanges,
  VersionChangesSchema,
  type VersionLine,
  VersionLineSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { runOperation } from "../../schema/run-operation";
import { OrderRef } from "../order/graphql";

type Changed = VersionChanges["changed"][number];
type VersionQuote = OrderVersionDto["quotes"][number];

const VersionLineRef = objectFromSchema<VersionLine>({
  name: "OrderVersionLine",
  schema: VersionLineSchema,
  description: "One line as an order version holds it (ADR 0116): its content, not its state.",
});

const ChangedLineRef = builder.objectRef<Changed>("OrderVersionChangedLine").implement({
  description: "A line whose content differs between the version and the order now.",
  fields: (t) => ({
    line: t.field({ type: VersionLineRef, resolve: (changed) => changed.line }),
    now: t.field({ type: VersionLineRef, resolve: (changed) => changed.now }),
    fields: t.exposeStringList("fields"),
  }),
});

const ChangesRef = objectFromSchema<VersionChanges>({
  name: "OrderVersionChanges",
  schema: VersionChangesSchema,
  omit: ["added", "removed", "changed"],
  description: VersionChangesSchema.description ?? "How the order now differs from a version.",
});
builder.objectFields(ChangesRef, (t) => ({
  added: t.field({
    type: [VersionLineRef],
    description: VersionChangesSchema.shape.added.description,
    resolve: (changes) => changes.added,
  }),
  removed: t.field({
    type: [VersionLineRef],
    description: VersionChangesSchema.shape.removed.description,
    resolve: (changes) => changes.removed,
  }),
  changed: t.field({
    type: [ChangedLineRef],
    description: VersionChangesSchema.shape.changed.description,
    resolve: (changes) => changes.changed,
  }),
}));

const VersionQuoteRef = builder.objectRef<VersionQuote>("OrderVersionQuote").implement({
  description: "A quote sent as the version.",
  fields: (t) => ({
    id: t.exposeID("id"),
    version: t.exposeInt("version"),
    quoteStatus: t.exposeString("quoteStatus"),
  }),
});

const DESCRIPTION =
  "Order version – the order's content at one moment (ADR 0116): its lines and headcounts, " +
  "captured automatically after every change. Restore one with restoreOrderVersion.";

export const OrderVersionRef = objectFromSchema<OrderVersionDto>({
  name: "OrderVersion",
  schema: OrderVersionSchema,
  omit: ["quotes"],
  description: DESCRIPTION,
});
builder.objectFields(OrderVersionRef, (t) => ({
  quotes: t.field({
    type: [VersionQuoteRef],
    description: OrderVersionSchema.shape.quotes.description,
    resolve: (version) => version.quotes,
  }),
}));

const OrderVersionDetailRef = objectFromSchema<OrderVersionDetail>({
  name: "OrderVersionDetail",
  schema: OrderVersionDetailSchema,
  omit: ["quotes", "lines", "changes"],
  description: DESCRIPTION,
});
builder.objectFields(OrderVersionDetailRef, (t) => ({
  quotes: t.field({ type: [VersionQuoteRef], resolve: (version) => version.quotes }),
  lines: t.field({ type: [VersionLineRef], resolve: (version) => version.lines }),
  changes: t.field({ type: ChangesRef, resolve: (version) => version.changes }),
}));

const OrderVersionListRef = builder.objectRef<OrderVersionList>("OrderVersionList").implement({
  description: "An order's versions, newest first.",
  fields: (t) => ({
    items: t.field({ type: [OrderVersionRef], resolve: (list) => list.items }),
  }),
});

fieldFromOperation({
  operation: listOrderVersions,
  type: OrderVersionListRef,
  name: "orderVersions",
});
fieldFromOperation({
  operation: getOrderVersion,
  type: OrderVersionDetailRef,
  name: "orderVersion",
});
mutationFromOperation({ operation: nameOrderVersion, type: OrderVersionDetailRef });
mutationFromOperation({ operation: restoreOrderVersion, type: OrderVersionDetailRef });

// Graph edge. It lives here so that order/graphql.ts does not need to import this file.
builder.objectField(OrderRef, "versions", (t) =>
  t.field({
    type: [OrderVersionRef],
    description: "The order's versions, newest first (ADR 0116).",
    resolve: async (order, _args, ctx) => {
      const list = (await runOperation({
        operation: listOrderVersions,
        input: { orderId: order.id },
        ctx,
      })) as OrderVersionList;
      return list.items;
    },
  }),
);
