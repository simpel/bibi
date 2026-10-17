import { listAssignments, listMyAssignments } from "./read-operations";
import { assignAssignment, followAssignment, unfollowAssignment } from "./write-operations";

export const assignmentOperations = [
  listAssignments,
  listMyAssignments,
  assignAssignment,
  followAssignment,
  unfollowAssignment,
];
