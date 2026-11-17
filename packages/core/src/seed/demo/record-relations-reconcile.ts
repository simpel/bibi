import { SYSTEM_ACTOR_ID } from "@bibi/db";
import { listSubjectAssignments } from "../../features/assignment/list-subject";
import type { AssignmentDto, AssignmentSubjectType } from "../../features/assignment/schema";
import { defineReconciliation, type ReconcileContext } from "./reconcile";

type RelationRow = {
  recordId: string;
  principalId: string;
  relation: "CREATOR" | "ASSIGNEE" | "FOLLOWER";
  responsibilityId: string | null;
  source: "EXPLICIT" | "DEFAULT";
};

const ALL = { status: { in: ["ACTIVE" as const, "ARCHIVED" as const] } };

const keyOf = ({ recordId, principalId, relation, responsibilityId }: RelationRow) =>
  `${recordId} ${principalId} ${relation} ${responsibilityId ?? "-"}`;

/** One slot's assignee and followers as relation rows. */
const rowsOfSlot = ({ recordId, slot }: { recordId: string; slot: AssignmentDto }) => {
  const rows: RelationRow[] = [];
  const responsibilityId = slot.responsibilityId;
  if (slot.assigneeId && slot.assigneeSource) {
    const source = slot.assigneeSource;
    rows.push({
      recordId,
      principalId: slot.assigneeId,
      relation: "ASSIGNEE",
      responsibilityId,
      source,
    });
  }
  for (const { userId, source } of slot.followers) {
    rows.push({ recordId, principalId: userId, relation: "FOLLOWER", responsibilityId, source });
  }
  return rows;
};

type Subject = { id: string; subjectType: AssignmentSubjectType; createdBy?: string | null };

/**
 * Who should be related to every order and item (ADR 0113), derived the way `assignment.list`
 * derives slots (ADR 0055): an independent derivation of what `sync_record_relations.sql` writes.
 */
async function rebuildRelations({ context }: ReconcileContext): Promise<RelationRow[]> {
  const select = { id: true, createdBy: true } as const;
  const orders = await context.db.order.findMany({ where: ALL, select });
  const items = await context.db.item.findMany({ where: ALL, select: { id: true } });
  const subjects: Subject[] = [
    ...orders.map((order) => ({ ...order, subjectType: "ORDER" as const })),
    ...items.map((item) => ({ ...item, subjectType: "ITEM" as const })),
  ];
  const rows: RelationRow[] = [];
  for (const { id: recordId, subjectType, createdBy } of subjects) {
    const slots = await listSubjectAssignments({ context, subjectType, subjectId: recordId });
    rows.push(...slots.flatMap((slot) => rowsOfSlot({ recordId, slot })));
    if (createdBy && createdBy !== SYSTEM_ACTOR_ID) {
      const creator = {
        principalId: createdBy,
        responsibilityId: null,
        source: "EXPLICIT" as const,
      };
      rows.push({ recordId, relation: "CREATOR", ...creator });
    }
  }
  return rows;
}

/** `RecordRelation` against the assignments and responsibilities it is derived from. */
export const recordRelationsReconciliation = defineReconciliation({
  name: "record-relations",
  rebuild: rebuildRelations,
  compare: async ({ context, rebuilt }) => {
    const stored = await context.db.recordRelation.findMany({
      select: {
        recordId: true,
        principalId: true,
        relation: true,
        responsibilityId: true,
        source: true,
      },
    });
    const byKey = new Map(stored.map((row) => [keyOf(row), row]));
    const differing: string[] = [];
    for (const want of rebuilt) {
      const have = byKey.get(keyOf(want));
      byKey.delete(keyOf(want));
      if (!have) differing.push(`lacks ${keyOf(want)} (${want.source})`);
      else if (have.source !== want.source) {
        differing.push(`${keyOf(want)} is ${have.source}, expected ${want.source}`);
      }
    }
    for (const row of byKey.values()) differing.push(`should not have ${keyOf(row)}`);
    return differing;
  },
});
