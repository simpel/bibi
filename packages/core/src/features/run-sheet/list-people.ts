import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { DerivedSlot } from "../assignment/derived-membership";
import type { AssignmentKind } from "../assignment/schema";
import { slotsOf } from "../assignment/slots-of";
import { userIdsOf } from "../assignment/user-ids-of";
import type { RunSheetFilter } from "./list-qualifiers";

type Context = Pick<OperationContext, "db" | "permissions" | "actor">;

const KINDS: Record<string, AssignmentKind[]> = {
  assignee: ["ASSIGNED"],
  follower: ["FOLLOWING"],
  involves: ["ASSIGNED", "FOLLOWING"],
};

export type SlotWhereInput = { filter: RunSheetFilter; context: Context };

/**
 * `assignee:`, `follower:` and `involves:` (either): run sheets whose responsibility on their
 * order the member answers for or follows, stored or by default (ADR 0055). Nobody named
 * matches nothing; `-involves:me` keeps the others.
 */
export async function slotWhere({ filter, context }: SlotWhereInput) {
  const slots: DerivedSlot[] = [];
  for (const value of filter.values) {
    for (const userId of await userIdsOf({ value, context })) {
      for (const kind of KINDS[filter.key] ?? []) {
        slots.push(...(await slotsOf({ context, userId, kind })));
      }
    }
  }
  const any: Prisma.RunSheetWhereInput =
    slots.length > 0
      ? { OR: slots.map(({ orderId, responsibilityId }) => ({ orderId, responsibilityId })) }
      : { id: { in: [] } };
  return filter.negated ? { NOT: any } : any;
}
