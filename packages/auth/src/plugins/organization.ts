import { OWNER_ROLE } from "@okazi/core";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { sendMail } from "../mail";
import { accessControl, orgRoles } from "../permissions";
import { webUrl } from "../urls";
import { assertKnownRoles } from "./check-member-roles";

/**
 * Organization = venue customer (ADR 0004). `Organization.id` is the `organizationId`
 * stored on every business row (Venue, Room, ...) and pinned by `scopedDb`.
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
      beforeCreateInvitation: async ({ invitation }) => {
        const { organizationId, role } = invitation;
        await assertKnownRoles({ organizationId, role });
      },
      // Better Auth lets the creator (owner) bypass its own `member:update` check here, so the
      // endpoint is closed outright: roles are assigned via core `member.assignRole` (audited).
      beforeUpdateMemberRole: async () => {
        throw new APIError("FORBIDDEN", { message: "Not allowed: use member.assignRole" });
      },
    },
    schema: {
      organizationRole: {
        additionalFields: {
          status: { type: "string", required: true, defaultValue: "ACTIVE", input: false },
          createdBy: { type: "string", required: false, input: false },
        },
      },
    },
    sendInvitationEmail: async ({ id, email, organization: org, inviter }) => {
      const url = webUrl({ path: `/accept-invitation/${id}` });
      await sendMail({
        to: email,
        subject: `Inbjudan till ${org.name} på Okazi`,
        text: `${inviter.user.name} har bjudit in dig till ${org.name}.\n\nAcceptera: ${url}`,
      });
    },
  });
}
