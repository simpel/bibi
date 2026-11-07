import { getOrganizationProfile } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { DomainJoinForm } from "./domain-join-form";
import { TimeZoneForm } from "./time-zone-form";

export type OrganizationSettingsProps = { locale: Locale; show: ReadonlySet<AdminSectionId> };

/** `/admin/general`: the organization's time zone (ADR 0064) and domain join (ADR 0078). */
export async function OrganizationSettings({ locale, show }: OrganizationSettingsProps) {
  const [abilities, profile] = await Promise.all([
    getCallerAbilities(),
    runOperation({ operation: getOrganizationProfile, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "configuration:write" });
  const canManageMembers = can({ abilities, permission: "member:write" });
  if (!profile.ok) {
    const error = (
      <ErrorState inline errorKey={handleLoadError({ error: profile.error, locale })} />
    );
    return (
      <>
        {show.has("timeZone") ? <AdminSection section="timeZone">{error}</AdminSection> : null}
        {show.has("domainJoin") ? <AdminSection section="domainJoin">{error}</AdminSection> : null}
      </>
    );
  }
  return (
    <>
      {show.has("timeZone") ? (
        <TimeZoneForm timeZone={profile.value.timeZone} canEdit={canEdit} />
      ) : null}
      {show.has("domainJoin") ? (
        <DomainJoinForm
          emailDomain={profile.value.emailDomain}
          enabled={profile.value.domainJoin}
          canEdit={canManageMembers}
        />
      ) : null}
    </>
  );
}
