import { ADMIN_ROLE } from "@bibi/core";
import type { Db } from "@bibi/db";
import { APIError } from "better-auth/api";
import { organization } from "better-auth/plugins";
import { enforceSlugHook } from "../organization/enforce-slug-hook";
import { accessControl, orgRoles } from "../permissions";
import { assertFixedRole } from "./check-member-roles";
import { provisionOrganizationHook } from "./provision-organization-hook";

const closed = ({ operation }: { operation: string }): never => {
  throw new APIError("FORBIDDEN", { message: `Not allowed: use ${operation}` });
};

/**
 * Organization = venue customer (ADR 0004). `Organization.id` is the `organizationId`
 * stored on every business row (Venue, Item, ...) and pinned by `scopedDb`.
 */
export function organizationPlugin({ db }: { db: Db }) {
  return organization({
    ac: accessControl,
    roles: orgRoles,
    creatorRole: ADMIN_ROLE,
    // Fixed roles only (ADR 0034): no `organizationRole` table, no dynamic access control.
    organizationHooks: {
      beforeCreateOrganization: enforceSlugHook({ db }),
      // Default ticket phases etc. are created by core as SYSTEM (ADR 0043).
      afterCreateOrganization: provisionOrganizationHook,
      beforeAddMember: async ({ member }) => {
        assertFixedRole({ role: member.role });
      },
      // Better Auth lets the creator bypass its own `member:update` check here, so the
      // endpoint is closed outright: roles are assigned via core `member.assignRole` (audited).
      beforeUpdateMemberRole: async () => closed({ operation: "member.assignRole" }),
      // Invitations and removals go through core `member.*` (authorized and audited there);
      // the invitation mail is sent by `invitationMailHook`. Accepting stays in Better Auth.
      beforeCreateInvitation: async () => closed({ operation: "member.invite" }),
      beforeCancelInvitation: async () => closed({ operation: "member.cancelInvitation" }),
      beforeRemoveMember: async () => closed({ operation: "member.remove" }),
    },
  });
}
