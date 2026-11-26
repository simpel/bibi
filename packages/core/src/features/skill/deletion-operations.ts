import {
  defineDeleteOperation,
  defineRestoreOperation,
} from "../../archive/define-lifecycle-operations";
import { skillKind } from "./deletion-kind";
import { skillEmbeddable } from "./embeddable";
import { getSkill } from "./read-operations";
import { SkillIdInputSchema } from "./schema";

export const restoreSkill = defineRestoreOperation({
  name: "skill.restore",
  description:
    "Restore an archived skill as a draft: publish it again to offer it. Your own personal " +
    "skills only; organization skills also need assistant:write. CONFLICT when it is not " +
    "archived or an active skill has its slug.",
  permission: "self:write",
  kind: skillKind,
  input: SkillIdInputSchema,
  get: getSkill,
  embeddable: skillEmbeddable,
});

export const deleteSkill = defineDeleteOperation({
  name: "skill.delete",
  description:
    "Delete an archived skill permanently (ADR 0118). Your own personal skills only; " +
    "organization skills also need assistant:write; SYSTEM skills never. An active skill is " +
    "CONFLICT: archive it first.",
  permission: "self:write",
  kind: skillKind,
  input: SkillIdInputSchema,
});
