import type { Prisma, Skill } from "@okazi/db";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";

type Viewer = { userId: string | null };

/**
 * Per-user visibility on top of scopedDb (which already limits rows to the org + SYSTEM):
 * SYSTEM and ORGANIZATION skills for everyone in the org, PERSONAL only for their owner.
 */
export function visibleSkillWhere({ userId }: Viewer): Prisma.SkillWhereInput {
  return {
    OR: [
      { scope: { in: ["SYSTEM", "ORGANIZATION"] } },
      { scope: "PERSONAL", ownerUserId: userId ?? "" },
    ],
  };
}

type ContextInput = { context: Pick<OperationContext, "actor" | "permissions"> };

export function isSkillAdmin({ context }: ContextInput): boolean {
  if (context.actor.type === "system") return true;
  return hasPermission({ permissions: context.permissions, permission: "skill:admin" });
}

export type FindVisibleSkillInput = { context: Pick<OperationContext, "actor" | "db">; id: string };

/** Loads a non-archived skill the actor may see; others' personal skills are "not found". */
export function findVisibleSkill({ context, id }: FindVisibleSkillInput): Promise<Skill | null> {
  const visible = visibleSkillWhere({ userId: context.actor.userId });
  return context.db.skill.findFirst({ where: { id, ...visible } });
}

const forbidden = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "FORBIDDEN", message }) });

export type CheckCanManageInput = ContextInput & { skill: Pick<Skill, "scope" | "ownerUserId"> };

/** SYSTEM is read-only, ORGANIZATION needs an org admin, PERSONAL only its owner. */
export function checkCanManageSkill({ context, skill }: CheckCanManageInput): Result<true> {
  if (skill.scope === "SYSTEM") {
    return forbidden({ message: "System skills are read-only; export and import to customise" });
  }
  if (skill.scope === "ORGANIZATION" && !isSkillAdmin({ context })) {
    return forbidden({ message: "Only organization admins can change organization skills" });
  }
  const owner = skill.ownerUserId === context.actor.userId || context.actor.type === "system";
  if (skill.scope === "PERSONAL" && !owner) {
    return forbidden({ message: "Only the owner can change a personal skill" });
  }
  return ok({ value: true });
}

export type CheckCanCreateInput = ContextInput & { scope: "ORGANIZATION" | "PERSONAL" };

export function checkCanCreateSkill({ context, scope }: CheckCanCreateInput): Result<true> {
  if (scope === "ORGANIZATION" && !isSkillAdmin({ context })) {
    return forbidden({ message: "Only organization admins can create organization skills" });
  }
  if (scope === "PERSONAL" && !context.actor.userId) {
    return forbidden({ message: "Personal skills need a user" });
  }
  return ok({ value: true });
}
