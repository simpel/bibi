import type { Skill } from "@okazi/db";
import type { Embeddable } from "../../search/embeddable";
import { visibleSkillWhere } from "./access";

const MAX_INSTRUCTIONS_TEXT = 4000;

/**
 * Org and personal skills are indexed per org by the indexing hook; SYSTEM skills are indexed
 * globally by `seedSystemSkills({ embed })`. Search filters hits through `visibleSkillWhere`.
 */
export const skillEmbeddable: Embeddable<Skill> = {
  entityType: "skill",
  isRecord: false,
  toText: ({ entity }) =>
    [
      entity.name,
      entity.slug,
      entity.description,
      entity.instructions.slice(0, MAX_INSTRUCTIONS_TEXT),
    ]
      .filter(Boolean)
      .join("\n"),
  load: ({ ids, db, viewer }) =>
    db.skill.findMany({
      where: {
        id: { in: [...ids] },
        ...(viewer ? visibleSkillWhere({ userId: viewer.userId }) : { scope: { not: "SYSTEM" } }),
      },
    }),
};
