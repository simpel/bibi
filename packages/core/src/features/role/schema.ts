import { z } from "zod";
import { PermissionSetSchema } from "../../permissions/permission-set";
import { OWNER_ROLE } from "../../permissions/resources";
import { ROLE_TEMPLATE_KEYS } from "../../templates/roles/role-templates";

export const RoleStatusSchema = z.enum(["ACTIVE", "ARCHIVED"]);

export const RoleSchema = z.object({
  id: z.string(),
  organizationId: z.string(),
  name: z.string(),
  permissions: PermissionSetSchema,
  /** True only for the fixed `owner` role, which cannot be changed or archived. */
  system: z.boolean(),
  status: RoleStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
  createdBy: z.string().nullable(),
});

export const RoleNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .refine((name) => !/[,%_]/.test(name), "Role names cannot contain , % or _")
  .refine((name) => name !== OWNER_ROLE, `"${OWNER_ROLE}" is a reserved system role`)
  .describe("Role name as staff see it, e.g. Säljare or Kök");

export const RoleCreateInputSchema = z.object({
  name: RoleNameSchema,
  permissions: PermissionSetSchema,
});

export const RoleUpdateInputSchema = z.object({
  id: z.string().min(1),
  name: RoleNameSchema.optional().describe("Renaming also renames the role on every member"),
  permissions: PermissionSetSchema.optional().describe("Replaces all permissions of the role"),
});

export const RoleIdInputSchema = z.object({ id: z.string().min(1) });

export const RoleListInputSchema = z.object({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const RoleListOutputSchema = z.object({
  items: z.array(RoleSchema),
  nextCursor: z.string().nullable(),
});

export const RoleImportTemplateInputSchema = z.object({
  template: z
    .enum(ROLE_TEMPLATE_KEYS)
    .describe("conference-venue: Admin, Säljare, Koordinator, Kök, Ekonomi, Läsare"),
});

export const RoleImportTemplateOutputSchema = z.object({
  /** Roles created by this import; names that already existed are skipped. */
  created: z.array(RoleSchema),
  skipped: z.array(z.string()),
});

export type RoleDto = z.infer<typeof RoleSchema>;
export type RoleCreateInput = z.infer<typeof RoleCreateInputSchema>;
export type RoleUpdateInput = z.infer<typeof RoleUpdateInputSchema>;
