import {
  archiveLine,
  changeLineState,
  createLine,
  expandLineBundle,
  expireTicketHolds,
  followLinePhase,
  getLine,
  type LineDto,
  LineSchema,
  listLines,
  updateLine,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { EntityTypeRef } from "../entity-type/graphql";
import { SetupRef } from "../setup/graphql";
import { TicketRef } from "../ticket/graphql";

export const LineRef = objectFromSchema<LineDto>({
  name: "Line",
  schema: LineSchema,
  omit: ["organizationId"],
  description:
    "Line – a row in a ticket's run schedule: type and fields, time, the " +
    "item and setup it uses, its state (ADR 0044), quantity, price overrides and a note, and " +
    "the effective quantity, unit price, discount and VAT with their sources (ADR 0052), and the " +
    "effective setup and teardown minutes with theirs (ADR 0059).",
});
const LinePageRef = pageType({ name: "LinePage", item: LineRef });

fieldFromOperation({ operation: listLines, type: LinePageRef, name: "lines" });
fieldFromOperation({ operation: getLine, type: LineRef, name: "line" });
mutationFromOperation({ operation: createLine, type: LineRef });
mutationFromOperation({ operation: updateLine, type: LineRef });
mutationFromOperation({ operation: archiveLine, type: LineRef });
mutationFromOperation({ operation: changeLineState, type: LineRef });
mutationFromOperation({ operation: followLinePhase, type: LineRef });

const ExpandBundleRef = builder.objectRef<{ items: LineDto[] }>("LineExpandBundleResult");
ExpandBundleRef.implement({
  description: "The lines `line.expandBundle` created: the bundle line first, then its parts.",
  fields: (t) => ({
    items: t.field({ type: [LineRef], resolve: (result) => result.items }),
  }),
});
mutationFromOperation({ operation: expandLineBundle, type: ExpandBundleRef });

const ExpireHoldsRef = builder.objectRef<{ items: LineDto[] }>("TicketExpireHoldsResult");
ExpireHoldsRef.implement({
  description: "The lines `ticket.expireHolds` moved to their type's expiry state.",
  fields: (t) => ({
    items: t.field({ type: [LineRef], resolve: (result) => result.items }),
  }),
});
mutationFromOperation({ operation: expireTicketHolds, type: ExpireHoldsRef });

builder.objectField(LineRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The line type, with its fields.",
    resolve: (line, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: line.entityTypeId }) as never;
    },
  }),
);

builder.objectField(LineRef, "setup", (t) =>
  t.field({
    type: SetupRef,
    nullable: true,
    description: "How the item is set up (null without a setup or if archived).",
    resolve: (line, _args, ctx) => {
      if (!line.setupId) return null;
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.setup.load({ id: line.setupId });
    },
  }),
);

// Graph edge. It lives here so that ticket/graphql.ts does not need to import this file.
builder.objectField(TicketRef, "lines", (t) =>
  t.field({
    type: [LineRef],
    description: "The ticket's run schedule, earliest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listLines,
        input: { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: LineDto[] };
      return page.items;
    },
  }),
);
