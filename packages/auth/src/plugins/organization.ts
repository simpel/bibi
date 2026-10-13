import { organization } from "better-auth/plugins";
import { sendMail } from "../mail";
import { accessControl, orgRoles } from "../permissions";
import { webUrl } from "../urls";

/**
 * Organization = venue customer (ADR 0004). `Organization.id` is the `organizationId`
 * stored on every business row (Venue, Room, ...) and pinned by `scopedDb`.
 */
export function organizationPlugin() {
  return organization({
    ac: accessControl,
    roles: orgRoles,
    creatorRole: "owner",
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
