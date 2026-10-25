import { type MemberProfileDto, MemberProfileSchema } from "@bibi/core/schemas";
import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";

/** A member profile carries no dates, so its tool result is the core shape as is. */
export const MemberProfileWireSchema = MemberProfileSchema;

export type MemberProfileWire = MemberProfileDto;

const memberProfileCard = uiEntry({
  component: "member-profile-card",
  schema: MemberProfileWireSchema,
  toProps: ({ value }) => ({ profile: value }),
});

/** Tool → component for a member's work in the organization (ADR 0068). */
export const MEMBER_PROFILE_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  memberProfile_get: memberProfileCard,
  memberProfile_update: memberProfileCard,
  memberProfile_setItems: memberProfileCard,
};
