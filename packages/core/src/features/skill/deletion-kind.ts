import type { Skill } from "@bibi/db";
import {
  ARCHIVED_SELECT,
  archivedRows,
  archivedWhere,
  type KindInput,
  type LifecycleKind,
  lifecycleRow,
} from "../../archive/lifecycle-kind";
import { hardDelete } from "../../archive/record-rows";
import { checkCanManageSkill, visibleSkillWhere } from "./access";

/** Organization and personal skills in any status; the system sees every one (the job). */
const ownSkillWhere = ({ context, id }: KindInput) => ({
  id,
  scope: { not: "SYSTEM" as const },
  status: { in: ["DRAFT" as const, "PUBLISHED" as const, "ARCHIVED" as const] },
  ...(context.actor.type === "system" ? {} : visibleSkillWhere({ userId: context.actor.userId })),
});

/**
 * Skills (ADR 0008, 0118): organization and personal ones only, never SYSTEM. Nothing refers to a
 * skill. Restored as a draft (its slug must be free: CONFLICT otherwise); the owner (personal) or
 * an admin (organization) restores and deletes it.
 */
export const skillKind: LifecycleKind = {
  entityType: "skill",
  label: "Skill",
  record: false,
  indexedAs: "skill",
  find: async ({ context, id }) =>
    lifecycleRow({
      row: await context.db.skill.findFirst({ where: ownSkillWhere({ context, id }) }),
    }),
  check: ({ context, row }) => checkCanManageSkill({ context, skill: row as Skill }),
  reactivate: async ({ context, id }) => {
    await context.db.skill.update({
      where: { id, status: "ARCHIVED" },
      data: { status: "DRAFT", archivedAt: null },
    });
  },
  deleteBlockers: async () => [],
  remove: async ({ context, id }) => {
    await hardDelete({ context }).skill.delete({ where: { id } });
  },
  archived: ({ context, before }) =>
    archivedRows({
      rows: context.db.skill.findMany({
        where: { ...archivedWhere({ before }), scope: { not: "SYSTEM" } },
        select: ARCHIVED_SELECT,
        orderBy: { archivedAt: "asc" },
      }),
    }),
};
