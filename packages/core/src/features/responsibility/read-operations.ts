import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
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
  permission: "responsibility:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.responsibility.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    return ok({ value: paginate({ rows, limit: input.limit }) });
  },
});

export const getResponsibility = defineOperation({
  name: "responsibility.get",
  kind: "query",
  description: "Get one responsibility by id.",
  input: ResponsibilityIdInputSchema,
  output: ResponsibilitySchema,
  permission: "responsibility:view",
  handler: async ({ input, context }) => {
    const row = await context.db.responsibility.findFirst({ where: { id: input.id } });
    return row ? ok({ value: row }) : notFound({ entity: "Responsibility" });
  },
});
