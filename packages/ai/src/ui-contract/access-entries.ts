import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  AuditLogListWireSchema,
  AuditLogWireSchema,
  InvitationListWireSchema,
  InvitationWireSchema,
  MemberListWireSchema,
  MemberWireSchema,
} from "./wire-schemas";

const memberCard = uiEntry({
  component: "member-card",
  schema: MemberWireSchema,
  toProps: ({ value }) => ({ member: value }),
});
const invitationCard = uiEntry({
  component: "invitation-card",
  schema: InvitationWireSchema,
  toProps: ({ value }) => ({ invitation: value }),
});

/** Members, invitations and the audit log (ADR 0004, 0006, 0034): tool name → generative-UI component. */
export const ACCESS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  member_list: uiEntry({
    component: "member-table",
    schema: MemberListWireSchema,
    toProps: ({ value }) => value,
  }),
  member_assignRole: memberCard,
  member_remove: memberCard,
  member_listInvitations: uiEntry({
    component: "invitation-table",
    schema: InvitationListWireSchema,
    toProps: ({ value }) => value,
  }),
  member_invite: invitationCard,
  member_cancelInvitation: invitationCard,
  auditLog_list: uiEntry({
    component: "audit-log-table",
    schema: AuditLogListWireSchema,
    toProps: ({ value }) => value,
  }),
  auditLog_get: uiEntry({
    component: "audit-log-card",
    schema: AuditLogWireSchema,
    toProps: ({ value }) => ({ entry: value }),
  }),
};
