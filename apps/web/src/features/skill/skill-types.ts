import type { SkillCreateInputSchema, SkillUpdateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";

/** Validated inputs of `skill.create` / `skill.update` (defaults applied). */
export type SkillCreateInput = z.infer<typeof SkillCreateInputSchema>;
export type SkillUpdateInput = z.infer<typeof SkillUpdateInputSchema>;

export type SkillScopeChoice = "PERSONAL" | "ORGANIZATION";
