import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  InvitationListWireSchema,
  InvitationWireSchema,
  MemberListWireSchema,
  MemberWireSchema,
  RoleImportWireSchema,
  RoleListWireSchema,
  RoleWireSchema,
} from "./wire-schemas";

const roleTable = uiEntry({
  component: "role-table",
  schema: RoleListWireSchema,
  toProps: ({ value }) => value,
});
const roleCard = uiEntry({
  component: "role-card",
  schema: RoleWireSchema,
  toProps: ({ value }) => ({ role: value }),
});
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

/** Roles, members and invitations (ADR 0004, 0020): tool name → generative-UI component. */
export const ACCESS_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  role_list: roleTable,
  role_get: roleCard,
  role_create: roleCard,
  role_update: roleCard,
  role_archive: roleCard,
  role_importTemplate: uiEntry({
    component: "role-table",
    schema: RoleImportWireSchema,
    toProps: ({ value }) => ({ items: value.created, nextCursor: null }),
  }),
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
};
