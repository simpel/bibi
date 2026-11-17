import type { SkillStatus } from "@bibi/db";
import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { HandlerInput } from "../../operations/types";
import { checkCanManageSkill, findVisibleSkill } from "./access";
import { skillEmbeddable } from "./embeddable";
import { skillNotFound } from "./not-found";
import { SkillIdInputSchema, SkillSchema } from "./schema";
import { toSkillDto } from "./to-skill-dto";

type SetStatusInput = HandlerInput<{ id: string }> & { status: SkillStatus };

async function setStatus({ input: { id }, context, status }: SetStatusInput) {
  const before = await findVisibleSkill({ context, id });
  if (!before) return skillNotFound();
  const allowed = checkCanManageSkill({ context, skill: before });
  if (!allowed.ok) return allowed;
  const skill = await context.db.skill.update({ where: { id }, data: { status } });
  const dto = toSkillDto({ skill });
  context.recordChange({ entityId: id, before: toSkillDto({ skill: before }), after: dto });
  return ok({ value: dto });
}

export const publishSkill = defineOperation({
  name: "skill.publish",
  kind: "command",
  description:
    "Publish a skill so the assistant offers it. Every user may call it for their own personal " +
    "skills; organization skills also need assistant:write. SYSTEM skills are read-only.",
  input: SkillIdInputSchema,
  output: SkillSchema,
  permission: "self:write",
  embeddable: skillEmbeddable,
  handler: ({ input, context }) => setStatus({ input, context, status: "PUBLISHED" }),
});

export const archiveSkill = defineOperation({
  name: "skill.archive",
  kind: "command",
  description:
    "Archive (soft-delete) a skill. Archived skills are hidden and free their slug. Your own " +
    "personal skills only; organization skills also need assistant:write. SYSTEM skills are read-only.",
  input: SkillIdInputSchema,
  output: SkillSchema,
  permission: "self:write",
  embeddable: skillEmbeddable,
  handler: ({ input, context }) => setStatus({ input, context, status: "ARCHIVED" }),
});
