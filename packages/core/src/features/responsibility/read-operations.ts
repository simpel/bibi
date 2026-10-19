import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import {
  findResponsibility,
  RESPONSIBILITY_INCLUDE,
  toResponsibilityDto,
} from "./responsibility-rows";
import {
  ResponsibilityIdInputSchema,
  ResponsibilityListInputSchema,
  ResponsibilityListOutputSchema,
  ResponsibilitySchema,
} from "./schema";

export const listResponsibilities = defineOperation({
  name: "responsibility.list",
  kind: "query",
  description:
    "List the organization's responsibilities (e.g. Head of kitchen, Head of exhibits): what " +
    "someone answers for, which item types each covers and its default assignee and followers.",
  input: ResponsibilityListInputSchema,
  output: ResponsibilityListOutputSchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.responsibility.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: RESPONSIBILITY_INCLUDE,
      ...pageArgs(input),
    });
    const items = rows.map((row) => toResponsibilityDto({ row }));
    return ok({ value: paginate({ rows: items, limit: input.limit }) });
  },
});

export const getResponsibility = defineOperation({
  name: "responsibility.get",
  kind: "query",
  description: "Get one responsibility by id.",
  input: ResponsibilityIdInputSchema,
  output: ResponsibilitySchema,
  permission: "configuration:read",
  handler: async ({ input, context }) => {
    const found = await findResponsibility({ context, id: input.id });
    return found ? ok({ value: found }) : notFound({ entity: "Responsibility" });
  },
});
