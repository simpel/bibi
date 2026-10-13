import { SkillResourceSchema, SkillScopeSchema, SkillStatusSchema } from "@okazi/core";
import { z } from "zod";

/** Skill as listed to the model (progressive disclosure: no instructions). */
export const PromptSkillSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  scope: SkillScopeSchema,
});

export type PromptSkill = z.infer<typeof PromptSkillSchema>;

/** `skill_list` structured content (JSON wire form; extra fields ignored). */
export const SkillListWireSchema = z.object({
  items: z.array(PromptSkillSchema.extend({ status: SkillStatusSchema })),
  nextCursor: z.string().nullable(),
});

/** `skill_get` structured content, the parts `load_skill` hands to the model. */
export const SkillDetailWireSchema = PromptSkillSchema.extend({
  status: SkillStatusSchema,
  instructions: z.string(),
  allowedTools: z.array(z.string()),
  resources: z.array(SkillResourceSchema),
  version: z.number().int(),
});

export type SkillDetail = z.infer<typeof SkillDetailWireSchema>;

/** `search` structured content. */
export const SearchWireSchema = z.object({
  hits: z.array(
    z.object({ entityType: z.string(), entityId: z.string(), score: z.number(), content: z.string() }),
  ),
});
