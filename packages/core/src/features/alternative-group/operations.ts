import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { chooseOption } from "./choose-option";
import { changeGroup, dissolveGroup, insertGroup } from "./group-commands";
import {
  AlternativeGroupChooseInputSchema,
  AlternativeGroupCreateInputSchema,
  AlternativeGroupIdInputSchema,
  AlternativeGroupListInputSchema,
  AlternativeGroupListOutputSchema,
  AlternativeGroupSchema,
  AlternativeGroupUpdateInputSchema,
} from "./schema";
import { loadGroup, toGroupDtos } from "./to-group-dto";

const OPTIONS_NOTE =
  "Every option keeps its own state and hold: soft holds on all options are the normal case " +
  "until the customer picks one; at most one option may be in a hard-hold state (VALIDATION).";
const Group = { output: AlternativeGroupSchema, permission: "program:write" } as const;

export const listAlternativeGroups = defineOperation({
  name: "alternativeGroup.list",
  kind: "query",
  description:
    "List alternative groups (lines of a ticket the customer picks one of, ADR 0052), oldest " +
    "first, with their options and the chosen one. Filter by ticket.",
  input: AlternativeGroupListInputSchema,
  output: AlternativeGroupListOutputSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.alternativeGroup.findMany({
      where: input.ticketId ? { ticketId: input.ticketId } : {},
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toGroupDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getAlternativeGroup = defineOperation({
  name: "alternativeGroup.get",
  kind: "query",
  description: "Get one alternative group by id, with its options and the chosen one.",
  input: AlternativeGroupIdInputSchema,
  output: AlternativeGroupSchema,
  permission: "program:read",
  handler: async ({ input, context }) => {
    const group = await loadGroup({ context, id: input.id });
    return group ? ok({ value: group }) : notFound({ entity: "Alternative group" });
  },
});

export const createAlternativeGroup = defineOperation({
  name: "alternativeGroup.create",
  kind: "command",
  description:
    "Make two or more lines of a ticket alternatives the customer picks one of (ADR 0052), " +
    "e.g. Room A or Room B. The quote shows each option's price and counts the cheapest as a " +
    `"from" price until one is chosen (alternativeGroup.choose). ${OPTIONS_NOTE}`,
  input: AlternativeGroupCreateInputSchema,
  ...Group,
  handler: insertGroup,
});

export const updateAlternativeGroup = defineOperation({
  name: "alternativeGroup.update",
  kind: "command",
  description:
    "Rename an alternative group or replace its options (lineIds; left-out lines become " +
    `ordinary lines). Options cannot change once one is chosen (CONFLICT). ${OPTIONS_NOTE}`,
  input: AlternativeGroupUpdateInputSchema,
  ...Group,
  handler: changeGroup,
});

export const archiveAlternativeGroup = defineOperation({
  name: "alternativeGroup.archive",
  kind: "command",
  description:
    "Dissolve (archive) an alternative group: its options become ordinary lines and keep their " +
    "states and holds. Sent quotes keep the group in their snapshot.",
  input: AlternativeGroupIdInputSchema,
  ...Group,
  permission: "program:delete",
  handler: dissolveGroup,
});

export const chooseAlternative = defineOperation({
  name: "alternativeGroup.choose",
  kind: "command",
  description:
    "Record which option of an alternative group the customer picked (ADR 0052). The other " +
    "options move to their item type's released state in the same change, which releases their " +
    "holds; they stay on the ticket as history. A group is chosen once (CONFLICT after that). " +
    "quote.accept can do the same with chosenLineIds.",
  input: AlternativeGroupChooseInputSchema,
  ...Group,
  handler: async ({ input: { id, lineId }, context }) => {
    const group = await loadGroup({ context, id });
    if (!group) return notFound({ entity: "Alternative group" });
    return chooseOption({ context, group, lineId });
  },
});

export const alternativeGroupOperations = [
  listAlternativeGroups,
  getAlternativeGroup,
  createAlternativeGroup,
  updateAlternativeGroup,
  archiveAlternativeGroup,
  chooseAlternative,
];
