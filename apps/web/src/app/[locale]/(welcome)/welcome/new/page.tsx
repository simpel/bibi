import { resolveLocale } from "@bibi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewOrganizationForm } from "@/features/welcome/ui/new/new-organization-form";
import { WelcomeStepFrame } from "@/features/welcome/ui/welcome-step-frame";

type NewOrganizationRouteProps = { params: Promise<{ locale: string }> };

/** Name the organization and choose its address (ADR 0062). */
export default async function NewOrganizationRoute({ params }: NewOrganizationRouteProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  const t = await getTranslations("welcome.new");
  return (
    <WelcomeStepFrame title={t("title")} description={t("description")}>
      <NewOrganizationForm />
    </WelcomeStepFrame>
  );
}
