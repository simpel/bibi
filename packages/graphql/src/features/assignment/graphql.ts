import {
  type AssignmentDto,
  AssignmentSchema,
  assignAssignment,
  followAssignment,
  listAssignments,
  listMyAssignments,
  unfollowAssignment,
} from "@okazi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { pageType } from "../../schema/page";
import { runOperation } from "../../schema/run-operation";
import { BookingRef } from "../booking/graphql";
import { InquiryRef } from "../inquiry/graphql";

export const AssignmentRef = objectFromSchema<AssignmentDto>({
  name: "Assignment",
  schema: AssignmentSchema,
  omit: ["organizationId"],
  description:
    "Assignment – who answers for an inquiry, a booking or an item (one assignee) and who " +
    "follows it. responsibilityId null is the main assignment.",
});
const AssignmentListRef = builder
  .objectRef<{ items: AssignmentDto[] }>("AssignmentList")
  .implement({
    description: "The assignments of one subject.",
    fields: (t) => ({ items: t.field({ type: [AssignmentRef], resolve: (list) => list.items }) }),
  });
const AssignmentPageRef = pageType({ name: "AssignmentPage", item: AssignmentRef });

fieldFromOperation({ operation: listAssignments, type: AssignmentListRef, name: "assignments" });
fieldFromOperation({
  operation: listMyAssignments,
  type: AssignmentPageRef,
  name: "myAssignments",
});
mutationFromOperation({ operation: assignAssignment, type: AssignmentRef });
mutationFromOperation({ operation: followAssignment, type: AssignmentRef });
mutationFromOperation({ operation: unfollowAssignment, type: AssignmentRef });

for (const [ref, subjectType] of [
  [BookingRef, "BOOKING"],
  [InquiryRef, "INQUIRY"],
] as const) {
  builder.objectField(ref, "assignments", (t) =>
    t.field({
      type: [AssignmentRef],
      description: "Who answers for it (main assignment first) and who follows it.",
      resolve: async (subject, _args, ctx) => {
        const list = (await runOperation({
          operation: listAssignments,
          input: { subjectType, subjectId: subject.id },
          ctx,
        })) as { items: AssignmentDto[] };
        return list.items;
      },
    }),
  );
}
