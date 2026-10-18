import {
  archiveProgramItem,
  changeLineState,
  createProgramItem,
  expireTicketHolds,
  getProgramItem,
  listProgramItems,
  type ProgramItemDto,
  ProgramItemSchema,
  updateProgramItem,
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

export const ProgramItemRef = objectFromSchema<ProgramItemDto>({
  name: "ProgramItem",
  schema: ProgramItemSchema,
  omit: ["organizationId"],
  description:
    "Program item (a line) – a row in a ticket's run schedule: type and fields, time, the " +
    "item and setup it uses, its state (ADR 0044), quantity and a note.",
});
const ProgramItemPageRef = pageType({ name: "ProgramItemPage", item: ProgramItemRef });

fieldFromOperation({ operation: listProgramItems, type: ProgramItemPageRef, name: "programItems" });
fieldFromOperation({ operation: getProgramItem, type: ProgramItemRef, name: "programItem" });
mutationFromOperation({ operation: createProgramItem, type: ProgramItemRef });
mutationFromOperation({ operation: updateProgramItem, type: ProgramItemRef });
mutationFromOperation({ operation: archiveProgramItem, type: ProgramItemRef });
mutationFromOperation({ operation: changeLineState, type: ProgramItemRef });

const ExpireHoldsRef = builder.objectRef<{ items: ProgramItemDto[] }>("TicketExpireHoldsResult");
ExpireHoldsRef.implement({
  description: "The lines `ticket.expireHolds` moved to their type's expiry state.",
  fields: (t) => ({
    items: t.field({ type: [ProgramItemRef], resolve: (result) => result.items }),
  }),
});
mutationFromOperation({ operation: expireTicketHolds, type: ExpireHoldsRef });

builder.objectField(ProgramItemRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The program item type, with its fields.",
    resolve: (programItem, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: programItem.entityTypeId }) as never;
    },
  }),
);

builder.objectField(ProgramItemRef, "setup", (t) =>
  t.field({
    type: SetupRef,
    nullable: true,
    description: "How the item is set up (null without a setup or if archived).",
    resolve: (programItem, _args, ctx) => {
      if (!programItem.setupId) return null;
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.setup.load({ id: programItem.setupId });
    },
  }),
);

// Graph edge. It lives here so that ticket/graphql.ts does not need to import this file.
builder.objectField(TicketRef, "programItems", (t) =>
  t.field({
    type: [ProgramItemRef],
    description: "The ticket's run schedule, earliest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listProgramItems,
        input: { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: ProgramItemDto[] };
      return page.items;
    },
  }),
);
