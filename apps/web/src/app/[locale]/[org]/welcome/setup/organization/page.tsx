import { listVenues } from "@bibi/core";
import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { loadStepState } from "@/features/welcome/load-step-state";
import { OrganizationForm } from "@/features/welcome/ui/setup/organization-form";
import { organizationDefaults } from "@/features/welcome/ui/setup/organization-schema";
import { welcomeProgress } from "@/features/welcome/ui/welcome-progress";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";
import { requireReadySession } from "@/server/guard";
import { runOperation } from "@/server/run-operation";

type OrganizationStepProps = { params: Promise<{ locale: string; org: string }> };

/** Legal, contact and address data; optionally the first venue at the same address. */
export default async function OrganizationStep({ params }: OrganizationStepProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  setRequestLocale(locale);
  const [state, session, venues, t] = await Promise.all([
    loadStepState({ locale }),
    requireReadySession({ locale }),
    runOperation({ operation: listVenues, input: { limit: 1 } }),
    getTranslations("welcome.setup.organization"),
  ]);
  const defaults = organizationDefaults({ profile: state.organization });
  const name = session.organizationName;
  return (
    <WelcomeStepFrame
      title={t("title", { organization: name })}
      description={t("description")}
      progress={welcomeProgress({ step: "setup/organization", state })}
    >
      <OrganizationForm
        org={org}
        name={name}
        defaults={defaults}
        canCreateVenue={venues.ok && venues.value.items.length === 0}
      />
    </WelcomeStepFrame>
  );
}
