import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { toJson } from "../../shared/to-json";
import { checkCanCreateSkill, checkCanManageSkill, findVisibleSkill } from "./access";
import { skillContentHash } from "./content-hash";
import { contentOfSkill } from "./content-of-skill";
import { skillEmbeddable } from "./embeddable";
import { insertSkill } from "./insert-skill";
import { skillNotFound } from "./not-found";
import { SkillCreateInputSchema, SkillSchema, SkillUpdateInputSchema } from "./schema";
import { slugify } from "./slugify";
import { toSkillDto } from "./to-skill-dto";

export const createSkill = defineOperation({
  name: "skill.create",
  kind: "command",
  description:
    "Create a skill (reusable assistant instructions) as a DRAFT. PERSONAL by default; " +
    "ORGANIZATION skills need an org admin.",
  input: SkillCreateInputSchema,
  output: SkillSchema,
  permission: "self:write",
  embeddable: skillEmbeddable,
  handler: async ({ input: { scope, slug, ...rest }, context }) => {
    const allowed = checkCanCreateSkill({ context, scope });
    if (!allowed.ok) return allowed;
    const content = { ...rest, slug: slug ?? slugify({ text: rest.name }) };
    const skill = await insertSkill({ context, scope, content, source: null });
    const dto = toSkillDto({ skill });
    context.recordChange({ entityId: skill.id, after: dto });
    return ok({ value: dto });
  },
});

export const updateSkill = defineOperation({
  name: "skill.update",
  kind: "command",
  description:
    "Update a skill's content. Omitted fields are unchanged; any change bumps the version. " +
    "SYSTEM skills are read-only.",
  input: SkillUpdateInputSchema,
  output: SkillSchema,
  permission: "self:write",
  embeddable: skillEmbeddable,
  handler: async ({ input: { id, ...changes }, context }) => {
    const before = await findVisibleSkill({ context, id });
    if (!before) return skillNotFound();
    const allowed = checkCanManageSkill({ context, skill: before });
    if (!allowed.ok) return allowed;
    const defined = Object.entries(changes).filter(([, value]) => value !== undefined);
    const content = { ...contentOfSkill({ skill: before }), ...Object.fromEntries(defined) };
    const contentHash = skillContentHash({ content });
    const changed = contentHash !== before.contentHash;
    const skill = await context.db.skill.update({
      where: { id },
      data: {
        ...content,
        resources: toJson({ value: content.resources }) ?? [],
        contentHash,
        version: changed ? before.version + 1 : before.version,
      },
    });
    const dto = toSkillDto({ skill });
    context.recordChange({ entityId: id, before: toSkillDto({ skill: before }), after: dto });
    return ok({ value: dto });
  },
});
