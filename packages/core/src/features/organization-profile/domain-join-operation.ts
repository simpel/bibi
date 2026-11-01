import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { invalid } from "../../shared/errors";
import { callerEmailDomain } from "./caller-email-domain";
import { loadOrganizationProfile } from "./load-organization-profile";
import { saveOrganizationProfile } from "./save-organization-profile";
import { OrganizationProfileSchema, OrganizationProfileSetDomainJoinInputSchema } from "./schema";

/**
 * Domain join (ADR 0078). Admin-only (`member:write` is locked): it decides who becomes a member.
 * Turning it on claims the caller's own verified domain, else keeps the stored one.
 */
export const setOrganizationDomainJoin = defineOperation({
  name: "organizationProfile.setDomainJoin",
  kind: "command",
  description:
    "Turn domain join on or off. On: anyone who signs in with a verified email at the " +
    "organization's email domain (e.g. venue.se) is offered to join as a member. The domain becomes the calling " +
    "admin's own verified work email domain, else stays the stored one; public mail providers " +
    "never count. " +
    "Someone who was a member before is not offered it again.",
  input: OrganizationProfileSetDomainJoinInputSchema,
  output: OrganizationProfileSchema,
  permission: "member:write",
  handler: async ({ input, context }) => {
    if (!input.enabled) {
      return ok({ value: await saveOrganizationProfile({ context, data: { domainJoin: false } }) });
    }
    const own = await callerEmailDomain({ context });
    const emailDomain = own ?? (await loadOrganizationProfile({ context }))?.emailDomain;
    if (!emailDomain) {
      return invalid({
        message: "No email domain to join by: sign in with a verified work email first",
        issues: [{ path: "enabled", message: "organizationSettings.domainJoin.noDomain" }],
      });
    }
    const data = { domainJoin: true, emailDomain };
    return ok({ value: await saveOrganizationProfile({ context, data }) });
  },
});
