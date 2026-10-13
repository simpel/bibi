import {
  archiveSkill,
  createSkill,
  exportSkill,
  getSkill,
  importSkill,
  listSkills,
  publishSkill,
  shareSkill,
  type SkillDto,
  SkillExportOutputSchema,
  SkillSchema,
  updateSkill,
} from "@okazi/core";
import type { z } from "zod";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";

export const SkillRef = objectFromSchema<SkillDto>({
  name: "Skill",
  schema: SkillSchema,
  description:
    "Reusable assistant instructions (Agent Skills style). SYSTEM skills have no " +
    "organizationId; resources are JSON `{ name, content }` objects.",
});
const SkillPageRef = pageType({ name: "SkillPage", item: SkillRef });
const SkillExportRef = objectFromSchema<z.infer<typeof SkillExportOutputSchema>>({
  name: "SkillExport",
  schema: SkillExportOutputSchema,
  description: "A skill rendered as SKILL.md.",
});

fieldFromOperation({ operation: listSkills, type: SkillPageRef, name: "skills" });
fieldFromOperation({ operation: getSkill, type: SkillRef, name: "skill" });
fieldFromOperation({ operation: exportSkill, type: SkillExportRef, name: "skillExport" });
mutationFromOperation({ operation: createSkill, type: SkillRef });
mutationFromOperation({ operation: updateSkill, type: SkillRef });
mutationFromOperation({ operation: publishSkill, type: SkillRef });
mutationFromOperation({ operation: archiveSkill, type: SkillRef });
mutationFromOperation({ operation: shareSkill, type: SkillRef });
mutationFromOperation({ operation: importSkill, type: SkillRef });
