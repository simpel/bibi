import type { AssignmentWire } from "@bibi/ai";
import { itemRoute } from "@/lib/configuration-routes";
import { orderRoute } from "@/lib/routes";

/** The page of an assignment's subject (order or item). */
export function assignmentSubjectHref({ assignment }: { assignment: AssignmentWire }): string {
  const id = assignment.subjectId;
  if (assignment.subjectType === "ORDER") return orderRoute({ id });
  return itemRoute({ id });
}
