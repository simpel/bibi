import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  RequirementIdInputSchema,
  RequirementListInputSchema,
  RequirementListOutputSchema,
  RequirementSchema,
} from "./schema";
import { loadRequirement, toRequirementDto } from "./to-requirement-dto";
import { archiveRequirement, createRequirement, updateRequirement } from "./write-operations";

export const listRequirements = defineOperation({
  name: "requirement.list",
  kind: "query",
  description:
    "List requirements: counts against list values (e.g. Gluten × 3) on tickets and program " +
    "items. lineId null = the whole ticket; a line's own count for a value " +
    "replaces the ticket's there. Filter by ticket, line or list value.",
  input: RequirementListInputSchema,
  output: RequirementListOutputSchema,
  permission: "requirement:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.requirement.findMany({
      where: {
        ...(input.ticketId ? { ticketId: input.ticketId } : {}),
        ...(input.lineId ? { lineId: input.lineId } : {}),
        ...(input.vocabularyValueId ? { vocabularyValueId: input.vocabularyValueId } : {}),
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = page.items.map((row) => toRequirementDto({ row }));
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getRequirement = defineOperation({
  name: "requirement.get",
  kind: "query",
  description: "Get one requirement by id, with the type's field values.",
  input: RequirementIdInputSchema,
  output: RequirementSchema,
  permission: "requirement:read",
  handler: async ({ input, context }) => {
    const requirement = await loadRequirement({ context, id: input.id });
    return requirement ? ok({ value: requirement }) : notFound({ entity: "Requirement" });
  },
});

export const requirementOperations = [
  listRequirements,
  getRequirement,
  createRequirement,
  updateRequirement,
  archiveRequirement,
];
