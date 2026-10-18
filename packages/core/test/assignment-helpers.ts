import {
  type AssignmentAssignInput,
  type AssignmentFollowInput,
  assignAssignment,
  type ExecuteContext,
  execute,
  followAssignment,
} from "../src/index";
import { unwrap } from "./helpers";

type Context = { context: ExecuteContext };

/** `assignment.assign` that must succeed. */
export async function assignTo({ context, ...input }: Context & AssignmentAssignInput) {
  return unwrap({ result: await execute({ operation: assignAssignment, input, context }) });
}

/** `assignment.follow` that must succeed. */
export async function followAs({ context, ...input }: Context & AssignmentFollowInput) {
  return unwrap({ result: await execute({ operation: followAssignment, input, context }) });
}

/** The main assignment slot of a ticket. */
export const ticketSubject = ({ id }: { id: string }) => ({
  subjectType: "TICKET" as const,
  subjectId: id,
});
