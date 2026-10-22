import { AssignmentAssignInputSchema, type AssignmentSubjectType } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";

/** Raw value of the assignee form: a user id, or `NONE` for no one. */
export type AssignFormValues = { assigneeId: string };

export type AssignFormOutput = z.infer<typeof AssignmentAssignInputSchema>;

export type AssignSubject = { subjectType: AssignmentSubjectType; subjectId: string };

export const assignFormDefaults = ({ assigneeId }: { assigneeId: string | null }) => ({
  assigneeId: assigneeId ?? NONE,
});

/** Core's `assignment.assign` schema for the subject's main assignment; `NONE` removes. */
export const assignFormSchema = ({ subject }: { subject: AssignSubject }) =>
  formSchema({
    schema: AssignmentAssignInputSchema,
    toInput: ({ values }: { values: AssignFormValues }) => ({
      ...subject,
      assigneeId: values.assigneeId === NONE || values.assigneeId === "" ? null : values.assigneeId,
    }),
  });
