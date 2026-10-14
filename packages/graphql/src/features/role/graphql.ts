import {
  archiveRole,
  createRole,
  getRole,
  importRoleTemplate,
  listRoles,
  type RoleDto,
  RoleSchema,
  updateRole,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const RoleRef = objectFromSchema<RoleDto>({
  name: "Role",
  schema: RoleSchema,
  omit: ["organizationId"],
  description:
    "Roll – a named set of permissions per resource (JSON `{ venue: [read, write] }`). " +
    "`owner` is the fixed system role.",
});
const RolePageRef = pageType({ name: "RolePage", item: RoleRef });

type RoleImport = { created: RoleDto[]; skipped: string[] };

const RoleImportRef = builder.objectRef<RoleImport>("RoleImport").implement({
  description: "Result of importing a role template.",
  fields: (t) => ({
    created: t.field({ type: [RoleRef], resolve: (result) => result.created }),
    skipped: t.stringList({
      description: "Names that already existed",
      resolve: (result) => result.skipped,
    }),
  }),
});

fieldFromOperation({ operation: listRoles, type: RolePageRef, name: "roles" });
fieldFromOperation({ operation: getRole, type: RoleRef, name: "role" });
mutationFromOperation({ operation: createRole, type: RoleRef });
mutationFromOperation({ operation: updateRole, type: RoleRef });
mutationFromOperation({ operation: archiveRole, type: RoleRef });
mutationFromOperation({ operation: importRoleTemplate, type: RoleImportRef });
