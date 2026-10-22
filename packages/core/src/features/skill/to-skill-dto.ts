import type { Skill } from "@bibi/db";
import type { SkillDto, SkillResource } from "./schema";

export type ToSkillDtoInput = { skill: Skill };

/** Types the JSON column; `execute` validates the output against `SkillSchema` anyway. */
export function toSkillDto({ skill }: ToSkillDtoInput): SkillDto {
  const { contentHash: _contentHash, ...rest } = skill;
  return {
    ...rest,
    allowedTools: skill.allowedTools ?? [],
    resources: skill.resources as SkillResource[],
  };
}
