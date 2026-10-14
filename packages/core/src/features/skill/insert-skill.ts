import type { Skill } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { skillContentHash } from "./content-hash";
import type { SkillContent } from "./schema";

export type InsertSkillInput = {
  context: Pick<OperationContext, "actor" | "db">;
  scope: "ORGANIZATION" | "PERSONAL";
  content: SkillContent;
  /** e.g. `import`, `share:<skillId>`; null for skills written in the app. */
  source: string | null;
};

/** Creates a DRAFT skill in the caller's org (scopedDb forces organizationId). */
export function insertSkill({ context, scope, content, source }: InsertSkillInput): Promise<Skill> {
  const userId = context.actor.userId;
  return context.db.skill.create({
    data: {
      ...content,
      resources: toJson({ value: content.resources }) ?? [],
      scope,
      organizationId: "",
      ownerUserId: scope === "PERSONAL" ? userId : null,
      contentHash: skillContentHash({ content }),
      source,
      status: "DRAFT",
      createdBy: userId,
    },
  });
}
