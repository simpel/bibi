import type { SkillDto } from "@okazi/core";

export type SkillAbilities = { edit: boolean; publish: boolean; archive: boolean; share: boolean };

export type SkillAbilitiesInput = {
  skill: Pick<SkillDto, "scope" | "status">;
  /** The caller is an organization admin (`assistant:edit`). */
  admin: boolean;
};

/**
 * Which buttons to offer (the operations enforce the same rules): SYSTEM is read-only,
 * ORGANIZATION needs an admin, PERSONAL is the owner's (only the owner can see it); sharing a
 * personal skill into the organization needs an admin.
 */
export function skillAbilities({ skill, admin }: SkillAbilitiesInput): SkillAbilities {
  const manage = skill.scope === "PERSONAL" || (skill.scope === "ORGANIZATION" && admin);
  const active = skill.status !== "ARCHIVED";
  return {
    edit: manage && active,
    publish: manage && skill.status === "DRAFT",
    archive: manage && active,
    share: skill.scope === "PERSONAL" && admin && active,
  };
}
