import { getOrganizationProfile } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminPage } from "@/components/admin/admin-page";
import { ErrorState } from "@/components/states/error-state";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { DomainJoinForm } from "./domain-join-form";
import { TimeZoneForm } from "./time-zone-form";

export type OrganizationSettingsProps = { locale: Locale };

/** `/admin/organization`: the organization's time zone (ADR 0064) and domain join (ADR 0078). */
export async function OrganizationSettings({ locale }: OrganizationSettingsProps) {
  const [t, abilities, profile] = await Promise.all([
    getTranslations("organizationSettings"),
    getCallerAbilities(),
    runOperation({ operation: getOrganizationProfile, input: {} }),
  ]);
  const canEdit = can({ abilities, permission: "configuration:write" });
  const canManageMembers = can({ abilities, permission: "member:write" });
  const header = <AdminHeader title={t("title")} description={t("description")} />;
  return (
    <AdminPage header={header}>
      {profile.ok ? (
        <>
          <TimeZoneForm timeZone={profile.value.timeZone} canEdit={canEdit} />
          <DomainJoinForm
            emailDomain={profile.value.emailDomain}
            enabled={profile.value.domainJoin}
            canEdit={canManageMembers}
          />
        </>
      ) : (
        <ErrorState inline errorKey={handleLoadError({ error: profile.error, locale })} />
      )}
    </AdminPage>
  );
}
