import { z } from "zod";

export const SkillScopeSchema = z.enum(["SYSTEM", "ORGANIZATION", "PERSONAL"]);
/** Scopes users can create in; SYSTEM skills only come from the repo seeder. */
export const WritableSkillScopeSchema = z.enum(["ORGANIZATION", "PERSONAL"]);
export const SkillStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const SKILL_SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const RESOURCE_END = "<!-- /okazi:resource -->";

export const SkillSlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(SKILL_SLUG_PATTERN)
  .describe("Lowercase-hyphenated id, e.g. create-venue-with-rooms");

export const ToolNameSchema = z
  .string()
  .regex(/^[a-z][a-z0-9_]{0,99}$/)
  .describe("MCP tool name, e.g. venue_create");

export const SkillResourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[\w.\- ]+$/),
  content: z
    .string()
    .max(20_000)
    .refine(
      (value) => !value.includes(RESOURCE_END),
      "Resource content contains a reserved marker",
    ),
});

const SkillResourcesSchema = z
  .array(SkillResourceSchema)
  .max(20)
  .refine(
    (list) => new Set(list.map((item) => item.name)).size === list.length,
    "Resource names must be unique",
  )
  .describe("Small named text resources, e.g. checklists or templates");

const AllowedToolsSchema = z
  .array(ToolNameSchema)
  .max(100)
  .describe("MCP tools the skill may use; the assistant never gets more than the user has");

export const SkillSchema = z.object({
  id: z.string(),
  scope: SkillScopeSchema,
  organizationId: z.string().nullable(),
  ownerUserId: z.string().nullable(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  instructions: z.string(),
  allowedTools: z.array(z.string()),
  resources: z.array(SkillResourceSchema),
  version: z.number().int(),
  status: SkillStatusSchema,
  source: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string().nullable(),
});

const contentFields = {
  name: z.string().trim().min(1).max(200).describe("Display name"),
  description: z
    .string()
    .trim()
    .min(1)
    .max(1024)
    .describe("When to use the skill; the assistant picks skills from this"),
  instructions: z.string().trim().min(1).max(100_000).describe("Markdown instructions"),
};

/** Everything a SKILL.md carries. */
export const SkillContentSchema = z.object({
  slug: SkillSlugSchema,
  ...contentFields,
  allowedTools: AllowedToolsSchema,
  resources: SkillResourcesSchema,
});

export const SkillCreateInputSchema = z.object({
  scope: WritableSkillScopeSchema.default("PERSONAL").describe("ORGANIZATION needs an org admin"),
  slug: SkillSlugSchema.optional().describe("Derived from the name when omitted"),
  ...contentFields,
  allowedTools: AllowedToolsSchema.default([]),
  resources: SkillResourcesSchema.default([]),
});

export const SkillUpdateInputSchema = z.object({
  id: z.string().min(1),
  slug: SkillSlugSchema.optional(),
  name: contentFields.name.optional(),
  description: contentFields.description.optional(),
  instructions: contentFields.instructions.optional(),
  allowedTools: AllowedToolsSchema.optional(),
  resources: SkillResourcesSchema.optional(),
});

export const SkillIdInputSchema = z.object({ id: z.string().min(1) });

export const SkillListInputSchema = z.object({
  scope: SkillScopeSchema.optional().describe("Only this scope"),
  status: SkillStatusSchema.optional().describe("Only this status (default: all but ARCHIVED)"),
  q: z.string().trim().min(1).max(200).optional().describe("Text in name, slug or description"),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.string().optional().describe("id of the last item from the previous page"),
});

export const SkillListOutputSchema = z.object({
  items: z.array(SkillSchema),
  nextCursor: z.string().nullable(),
});

export const SkillShareInputSchema = z.object({
  id: z.string().min(1).describe("Id of your personal skill"),
  slug: SkillSlugSchema.optional().describe("Slug in the organization (default: same)"),
});

export const SkillImportInputSchema = z.object({
  markdown: z.string().min(1).max(200_000).describe("SKILL.md: YAML frontmatter + markdown body"),
  scope: WritableSkillScopeSchema.default("PERSONAL"),
});

export const SkillExportOutputSchema = z.object({
  markdown: z.string().describe("SKILL.md content"),
  filename: z.string().describe("Suggested path, e.g. create-venue-with-rooms/SKILL.md"),
});

export type SkillDto = z.infer<typeof SkillSchema>;
export type SkillContent = z.infer<typeof SkillContentSchema>;
export type SkillResource = z.infer<typeof SkillResourceSchema>;
