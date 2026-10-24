import { getOrganizationProfile } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { TimeZoneForm } from "./time-zone-form";

export type OrganizationSettingsProps = { locale: Locale };

/** `/settings/organization`: the organization's own settings, so far its time zone (ADR 0064). */
export async function OrganizationSettings({ locale }: OrganizationSettingsProps) {
  const t = await getTranslations("organizationSettings");
  const canEdit = can({
    abilities: await getCallerAbilities(),
    permission: "configuration:write",
  });
  const profile = await runOperation({ operation: getOrganizationProfile, input: {} });
  return (
    <div className="grid gap-6">
      <PageHeader title={t("title")} description={t("description")} />
      {profile.ok ? (
        <TimeZoneForm timeZone={profile.value.timeZone} canEdit={canEdit} />
      ) : (
        <ErrorState errorKey={handleLoadError({ error: profile.error, locale })} />
      )}
    </div>
  );
}
