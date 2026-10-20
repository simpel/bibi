import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { parseSkillMarkdown } from "../../skills/markdown/parse-skill-markdown";
import { checkCanCreateSkill, findVisibleSkill } from "./access";
import { contentOfSkill } from "./content-of-skill";
import { skillEmbeddable } from "./embeddable";
import { insertSkill } from "./insert-skill";
import { skillNotFound } from "./not-found";
import { SkillImportInputSchema, SkillSchema, SkillShareInputSchema } from "./schema";
import { toSkillDto } from "./to-skill-dto";

export const shareSkill = defineOperation({
  name: "skill.share",
  kind: "command",
  description:
    "Share one of your personal skills with the organization: copies it as an ORGANIZATION " +
    "skill (DRAFT) and keeps your personal original. Needs an org admin.",
  input: SkillShareInputSchema,
  output: SkillSchema,
  permission: "assistant:write",
  embeddable: skillEmbeddable,
  handler: async ({ input, context }) => {
    const source = await findVisibleSkill({ context, id: input.id });
    if (!source) return skillNotFound();
    if (source.scope !== "PERSONAL" || source.ownerUserId !== context.actor.userId) {
      const message = "Only your own personal skills can be shared";
      return err({ error: new AppError({ code: "VALIDATION", message }) });
    }
    const content = { ...contentOfSkill({ skill: source }), slug: input.slug ?? source.slug };
    const skill = await insertSkill({
      context,
      scope: "ORGANIZATION",
      content,
      source: `share:${source.id}`,
    });
    const dto = toSkillDto({ skill });
    context.recordChange({ entityId: skill.id, after: dto });
    return ok({ value: dto });
  },
});

export const importSkill = defineOperation({
  name: "skill.import",
  kind: "command",
  description:
    "Import a SKILL.md (YAML frontmatter name, description, allowed-tools + markdown body) as " +
    "a DRAFT skill. PERSONAL by default; ORGANIZATION needs an org admin.",
  input: SkillImportInputSchema,
  output: SkillSchema,
  permission: "self:write",
  embeddable: skillEmbeddable,
  handler: async ({ input, context }) => {
    const allowed = checkCanCreateSkill({ context, scope: input.scope });
    if (!allowed.ok) return allowed;
    const parsed = parseSkillMarkdown({ markdown: input.markdown });
    if (!parsed.ok) return parsed;
    const skill = await insertSkill({
      context,
      scope: input.scope,
      content: parsed.value,
      source: "import",
    });
    const dto = toSkillDto({ skill });
    context.recordChange({ entityId: skill.id, after: dto });
    return ok({ value: dto });
  },
});
