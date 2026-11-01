import { getOrganizationProfile } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { DomainJoinForm } from "./domain-join-form";
import { TimeZoneForm } from "./time-zone-form";

export type OrganizationSettingsProps = { locale: Locale };

/** `/settings/organization`: the organization's time zone (ADR 0064) and domain join (ADR 0078). */
export async function OrganizationSettings({ locale }: OrganizationSettingsProps) {
  const t = await getTranslations("organizationSettings");
  const abilities = await getCallerAbilities();
  const canEdit = can({ abilities, permission: "configuration:write" });
  const canManageMembers = can({ abilities, permission: "member:write" });
  const profile = await runOperation({ operation: getOrganizationProfile, input: {} });
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
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
        <ErrorState errorKey={handleLoadError({ error: profile.error, locale })} />
      )}
    </div>
  );
}
