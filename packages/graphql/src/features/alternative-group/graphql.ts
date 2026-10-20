import {
  type AlternativeGroupDto,
  AlternativeGroupSchema,
  archiveAlternativeGroup,
  chooseAlternative,
  createAlternativeGroup,
  getAlternativeGroup,
  listAlternativeGroups,
  updateAlternativeGroup,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { TicketRef } from "../ticket/graphql";

export const AlternativeGroupRef = objectFromSchema<AlternativeGroupDto>({
  name: "AlternativeGroup",
  schema: AlternativeGroupSchema,
  omit: ["organizationId"],
  description:
    "Alternative group – lines of a ticket the customer picks exactly one of, e.g. Room A or " +
    "Room B (ADR 0052): its options and the chosen one.",
});
const AlternativeGroupPageRef = pageType({
  name: "AlternativeGroupPage",
  item: AlternativeGroupRef,
});

fieldFromOperation({
  operation: listAlternativeGroups,
  type: AlternativeGroupPageRef,
  name: "alternativeGroups",
});
fieldFromOperation({
  operation: getAlternativeGroup,
  type: AlternativeGroupRef,
  name: "alternativeGroup",
});
mutationFromOperation({ operation: createAlternativeGroup, type: AlternativeGroupRef });
mutationFromOperation({ operation: updateAlternativeGroup, type: AlternativeGroupRef });
mutationFromOperation({ operation: archiveAlternativeGroup, type: AlternativeGroupRef });
mutationFromOperation({ operation: chooseAlternative, type: AlternativeGroupRef });

// Graph edge. It lives here so that ticket/graphql.ts does not need to import this file.
builder.objectField(TicketRef, "alternativeGroups", (t) =>
  t.field({
    type: [AlternativeGroupRef],
    description: "The ticket's alternative groups, oldest first.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const page = (await runOperation({
        operation: listAlternativeGroups,
        input: { ticketId: ticket.id, limit: Math.min(Math.max(limit ?? 50, 1), 100) },
        ctx,
      })) as { items: AlternativeGroupDto[] };
      return page.items;
    },
  }),
);
