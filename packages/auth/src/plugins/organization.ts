import { OWNER_ROLE } from "@okazi/core";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { accessControl, orgRoles } from "../permissions";
import { assertKnownRoles } from "./check-member-roles";

const closed = ({ operation }: { operation: string }): never => {
  throw new APIError("FORBIDDEN", { message: `Not allowed: use ${operation}` });
};

/**
 * Organization = venue customer (ADR 0004). `Organization.id` is the `organizationId`
 * stored on every business row (Venue, Item, ...) and pinned by `scopedDb`.
 */
export function organizationPlugin() {
  return organization({
    ac: accessControl,
    roles: orgRoles,
    creatorRole: OWNER_ROLE,
    // Custom roles per organization (ADR 0020). Rows are written by core `role.*` only.
    dynamicAccessControl: { enabled: true },
    organizationHooks: {
      beforeAddMember: async ({ member }) => {
        await assertKnownRoles({ organizationId: member.organizationId, role: member.role });
      },
      // Better Auth lets the creator (owner) bypass its own `member:update` check here, so the
      // endpoint is closed outright: roles are assigned via core `member.assignRole` (audited).
      beforeUpdateMemberRole: async () => closed({ operation: "member.assignRole" }),
      // Invitations and removals go through core `member.*` (authorized and audited there);
      // the invitation mail is sent by `invitationMailHook`. Accepting stays in Better Auth.
      beforeCreateInvitation: async () => closed({ operation: "member.invite" }),
      beforeCancelInvitation: async () => closed({ operation: "member.cancelInvitation" }),
      beforeRemoveMember: async () => closed({ operation: "member.remove" }),
    },
    schema: {
      organizationRole: {
        additionalFields: {
          status: { type: "string", required: true, defaultValue: "ACTIVE", input: false },
          createdBy: { type: "string", required: false, input: false },
        },
      },
    },
  });
}
