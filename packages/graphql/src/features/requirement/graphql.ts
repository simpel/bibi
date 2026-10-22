import {
  archiveRequirement,
  createRequirement,
  getRequirement,
  listRequirements,
  type RequirementDto,
  RequirementSchema,
  updateRequirement,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { requirePermission } from "../../schema/require-permission";
import { runOperation } from "../../schema/run-operation";
import { EntityTypeRef } from "../entity-type/graphql";
import { LineRef } from "../line/graphql";
import { TicketRef } from "../ticket/graphql";
import { VocabularyValueRef } from "../vocabulary/graphql";

export const RequirementRef = objectFromSchema<RequirementDto>({
  name: "Requirement",
  schema: RequirementSchema,
  omit: ["organizationId"],
  description:
    "Requirement – a count against a list value (e.g. Gluten × 3) on a ticket, or on one of " +
    "its lines where it replaces the ticket's count. Never linked to a person.",
});
const RequirementPageRef = pageType({ name: "RequirementPage", item: RequirementRef });

fieldFromOperation({ operation: listRequirements, type: RequirementPageRef, name: "requirements" });
fieldFromOperation({ operation: getRequirement, type: RequirementRef, name: "requirement" });
mutationFromOperation({ operation: createRequirement, type: RequirementRef });
mutationFromOperation({ operation: updateRequirement, type: RequirementRef });
mutationFromOperation({ operation: archiveRequirement, type: RequirementRef });

builder.objectField(RequirementRef, "entityType", (t) =>
  t.field({
    type: EntityTypeRef,
    description: "The requirement type, with its fields.",
    resolve: (requirement, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.entityType.load({ id: requirement.entityTypeId }) as never;
    },
  }),
);

builder.objectField(RequirementRef, "vocabularyValue", (t) =>
  t.field({
    type: VocabularyValueRef,
    nullable: true,
    description: "The list value counted, e.g. Gluten.",
    resolve: (requirement, _args, ctx) => {
      requirePermission({ ctx, permission: "configuration:read" });
      return ctx.loaders.vocabularyValue.load({ id: requirement.vocabularyValueId });
    },
  }),
);

type ListByInput = { ticketId?: string; lineId?: string; limit: number | null | undefined };

/** Graph edges from the ticket and the line; they read through `requirement.list`. */
const listBy = ({ limit, ...where }: ListByInput) => ({
  ...where,
  limit: Math.min(Math.max(limit ?? 50, 1), 100),
});

// Graph edges. They live here so that ticket/ and line/graphql.ts need not import this.
builder.objectField(TicketRef, "requirements", (t) =>
  t.field({
    type: [RequirementRef],
    description: "The ticket's requirements, both levels (lineId null = the ticket).",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (ticket, { limit }, ctx) => {
      const input = listBy({ ticketId: ticket.id, limit });
      const page = (await runOperation({ operation: listRequirements, input, ctx })) as {
        items: RequirementDto[];
      };
      return page.items;
    },
  }),
);

builder.objectField(LineRef, "requirements", (t) =>
  t.field({
    type: [RequirementRef],
    description: "The line's own counts; they replace the ticket's for their values.",
    args: { limit: t.arg.int({ defaultValue: 50, description: "Max 100" }) },
    resolve: async (line, { limit }, ctx) => {
      const input = listBy({ lineId: line.id, limit });
      const page = (await runOperation({ operation: listRequirements, input, ctx })) as {
        items: RequirementDto[];
      };
      return page.items;
    },
  }),
);
