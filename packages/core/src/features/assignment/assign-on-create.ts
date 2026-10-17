import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { checkMembers } from "../../shared/check-members";
import type { AssignmentSubjectType } from "./schema";
import { saveAssignee } from "./write-assignment";

/** The assignee given when a subject is created must be a member (path `assigneeId`). */
export const checkNewAssignee = ({
  context,
  assigneeId,
}: {
  context: Pick<OperationContext, "db">;
  assigneeId: string | null | undefined;
}) => checkMembers({ context, userIds: { assigneeId } });

export type AssignOnCreateInput = {
  context: OperationContext;
  subjectType: AssignmentSubjectType;
  subjectId: string;
  assigneeId: string | null | undefined;
};

/** Creates the main assignment of a new subject when an assignee is given (checked before). */
export async function assignOnCreate({
  context,
  assigneeId,
  ...subject
}: AssignOnCreateInput): Promise<Result<true>> {
  if (assigneeId) await saveAssignee({ context, ...subject, assigneeId });
  return ok({ value: true });
}
