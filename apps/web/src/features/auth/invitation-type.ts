/** An invitation as its invitee sees it; anything unexpected counts as invalid. */
export type InvitationView =
  | { status: "invalid" }
  | { status: "ready"; organizationName: string; inviterEmail: string; role: string };
