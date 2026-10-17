import type { AssignmentWire } from "@okazi/ai";
import { itemRoute } from "@/lib/configuration-routes";
import { bookingRoute, inquiryRoute } from "@/lib/routes";

/** The page of an assignment's subject (inquiry, booking or item). */
export function assignmentSubjectHref({ assignment }: { assignment: AssignmentWire }): string {
  const id = assignment.subjectId;
  if (assignment.subjectType === "INQUIRY") return inquiryRoute({ id });
  if (assignment.subjectType === "BOOKING") return bookingRoute({ id });
  return itemRoute({ id });
}
