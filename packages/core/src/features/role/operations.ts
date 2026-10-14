import { archiveRole, importRoleTemplate } from "./lifecycle-operations";
import { getRole, listRoles } from "./read-operations";
import { createRole, updateRole } from "./write-operations";

/** Every role operation (ADR 0020); implementations live in the sibling `*-operations.ts`. */
export const roleOperations = [
  listRoles,
  getRole,
  createRole,
  updateRole,
  archiveRole,
  importRoleTemplate,
];
