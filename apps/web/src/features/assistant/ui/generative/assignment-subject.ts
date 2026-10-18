import type { AssignmentWire } from "@okazi/ai";
import { itemRoute } from "@/lib/configuration-routes";
import { ticketRoute } from "@/lib/routes";

/** The page of an assignment's subject (ticket or item). */
export function assignmentSubjectHref({ assignment }: { assignment: AssignmentWire }): string {
  const id = assignment.subjectId;
  if (assignment.subjectType === "TICKET") return ticketRoute({ id });
  return itemRoute({ id });
}
