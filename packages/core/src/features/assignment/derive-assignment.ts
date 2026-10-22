import type { Assignment } from "@bibi/db";
import type { AssignmentDto, AssignmentSubjectType } from "./schema";

/** A stored choice with its explicit follows and unfollows (ADR 0055). */
export type ChoiceRow = Assignment & {
  followers: { userId: string; effect: "FOLLOW" | "UNFOLLOW" }[];
};

/** What a responsibility gives every ticket it applies to (ADR 0055): never copied onto it. */
export type SlotDefaults = { assigneeId: string; followerIds: readonly string[] };

export type DeriveAssignmentInput = {
  organizationId: string;
  subjectType: AssignmentSubjectType;
  subjectId: string;
  responsibilityId: string | null;
  /** The stored choice for the slot, if someone made one. */
  row: ChoiceRow | null;
  /** The responsibility's defaults; null for the main assignment. */
  defaults: SlotDefaults | null;
};

/** An archived row is no longer a choice; it is only reactivated by the next write. */
const activeChoice = ({ row }: { row: ChoiceRow | null }) =>
  row?.status === "ACTIVE" ? row : null;

/**
 * Who answers for the slot and who follows it (ADR 0055): an explicit assignee, else the default
 * assignee; the default followers plus explicit follows, minus explicit unfollows.
 */
export function deriveAssignment({ row, defaults, ...slot }: DeriveAssignmentInput): AssignmentDto {
  const choice = activeChoice({ row });
  const explicit = choice?.assigneeId ?? null;
  const assigneeId = explicit ?? defaults?.assigneeId ?? null;
  const left = new Set(
    (choice?.followers ?? []).filter((f) => f.effect === "UNFOLLOW").map((f) => f.userId),
  );
  const fromDefaults = (defaults?.followerIds ?? []).filter((userId) => !left.has(userId));
  const chosen = (choice?.followers ?? [])
    .filter((f) => f.effect === "FOLLOW" && !fromDefaults.includes(f.userId))
    .map((f) => f.userId);
  return {
    ...slot,
    id: choice?.id ?? null,
    assigneeId,
    assigneeSource: explicit ? "EXPLICIT" : assigneeId ? "DEFAULT" : null,
    followers: [
      ...fromDefaults.map((userId) => ({ userId, source: "DEFAULT" as const })),
      ...chosen.map((userId) => ({ userId, source: "EXPLICIT" as const })),
    ],
    status: "ACTIVE",
    createdAt: choice?.createdAt ?? null,
    updatedAt: choice?.updatedAt ?? null,
    createdBy: choice?.createdBy ?? null,
  };
}

/** The user ids of an assignment's followers, defaults and explicit follows alike. */
export const effectiveFollowerIds = ({ assignment }: { assignment: AssignmentDto }): string[] =>
  assignment.followers.map((follower) => follower.userId);
