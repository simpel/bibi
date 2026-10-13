import type { Skill } from "@okazi/db";
import { z } from "zod";
import { type SkillContent, SkillResourceSchema } from "./schema";

const StoredResourcesSchema = z.array(SkillResourceSchema).catch([]);

export type ContentOfSkillInput = { skill: Skill };

/** The SKILL.md-relevant fields of a stored row (resources JSON parsed defensively). */
export function contentOfSkill({ skill }: ContentOfSkillInput): SkillContent {
  return {
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    instructions: skill.instructions,
    allowedTools: skill.allowedTools ?? [],
    resources: StoredResourcesSchema.parse(skill.resources),
  };
}
