import type { OperationContext } from "../../operations/types";
import { applicableResponsibilityIds } from "./applicable-responsibilities";
import { deriveAssignment } from "./derive-assignment";
import { ASSIGNMENT_INCLUDE, loadDefaults } from "./load-assignment";
import type { AssignmentDto, AssignmentSubjectType } from "./schema";

export type ListSubjectInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  subjectType: AssignmentSubjectType;
  subjectId: string;
};

/**
 * The assignments of one subject, derived (ADR 0055): its stored main assignment first, then one
 * per responsibility that applies to a ticket (from its lines) or that someone chose explicitly.
 */
export async function listSubjectAssignments({
  context,
  subjectType,
  subjectId,
}: ListSubjectInput): Promise<AssignmentDto[]> {
  const rows = await context.db.assignment.findMany({
    where: { recordId: subjectId },
    include: ASSIGNMENT_INCLUDE,
  });
  const applicable =
    subjectType === "TICKET"
      ? ((await applicableResponsibilityIds({ context, ticketIds: [subjectId] })).get(subjectId) ??
        new Set<string>())
      : new Set<string>();
  const ids = new Set([...applicable, ...rows.flatMap((r) => r.responsibilityId ?? [])]);
  const defaults = await loadDefaults({ context, responsibilityIds: [...ids] });
  const slots = new Set([...rows.map((row) => row.responsibilityId), ...applicable]);
  return [...slots]
    .filter((id) => id === null || defaults.has(id))
    .sort((a, b) => (a ?? "").localeCompare(b ?? ""))
    .map((responsibilityId) =>
      deriveAssignment({
        ...{ organizationId: context.organizationId, subjectType, subjectId, responsibilityId },
        row: rows.find((row) => row.responsibilityId === responsibilityId) ?? null,
        defaults: responsibilityId ? (defaults.get(responsibilityId) ?? null) : null,
      }),
    );
}
