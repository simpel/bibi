import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { paginate } from "../../shared/paginate";
import { roleNotFound } from "./access";
import { RoleIdInputSchema, RoleListInputSchema, RoleListOutputSchema, RoleSchema } from "./schema";
import { OWNER_ROLE_ID, ownerRoleDto, toRoleDto } from "./to-role-dto";

export const listRoles = defineOperation({
  name: "role.list",
  kind: "query",
  description:
    "List the organization's roles and what each may do per resource (read/write/admin). " +
    "The first page starts with the fixed system role owner.",
  input: RoleListInputSchema,
  output: RoleListOutputSchema,
  permission: "role:read",
  handler: async ({ input, context }) => {
    const rows = await context.db.organizationRole.findMany({
      orderBy: [{ role: "asc" }, { id: "asc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    });
    const page = paginate({ rows: rows.map((row) => toRoleDto({ row })), limit: input.limit });
    const owner = input.cursor ? [] : [ownerRoleDto({ organizationId: context.organizationId })];
    return ok({ value: { ...page, items: [...owner, ...page.items] } });
  },
});

export const getRole = defineOperation({
  name: "role.get",
  kind: "query",
  description: 'Get one role by id (the fixed owner role has id "owner").',
  input: RoleIdInputSchema,
  output: RoleSchema,
  permission: "role:read",
  handler: async ({ input, context }) => {
    if (input.id === OWNER_ROLE_ID) {
      return ok({ value: ownerRoleDto({ organizationId: context.organizationId }) });
    }
    const row = await context.db.organizationRole.findFirst({ where: { id: input.id } });
    return row ? ok({ value: toRoleDto({ row }) }) : roleNotFound();
  },
});
