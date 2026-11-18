import { listAssignments } from "@bibi/core";
import { runOperation } from "@/server/run-operation";
import type { AssignSubject } from "./assign-form-schema";
import { FollowButton } from "./follow-button";

export type FollowControlProps = {
  subject: AssignSubject;
  /** The signed-in member. */
  userId: string;
};

/**
 * The Follow button on a subject's title row, with whether the member follows it now (the main
 * assignment's followers, defaults included). Streams in after the header; nothing on error.
 */
export async function FollowControl({ subject, userId }: FollowControlProps) {
  const result = await runOperation({ operation: listAssignments, input: subject });
  if (!result.ok) return null;
  const main = result.value.items.find((assignment) => assignment.responsibilityId === null);
  const following = main?.followers.some((follower) => follower.userId === userId) ?? false;
  return <FollowButton subject={subject} userId={userId} following={following} />;
}
