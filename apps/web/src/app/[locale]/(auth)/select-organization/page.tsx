import { resolveLocale } from "@okazi/i18n";
import { Separator } from "@okazi/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthCard } from "@/features/auth/ui/auth-card";
import { CreateOrganizationForm } from "@/features/auth/ui/create-organization-form";
import { OrganizationPicker } from "@/features/auth/ui/organization-picker";
import { requireAnySession } from "@/server/auth-pages";

type SelectOrganizationPageProps = { params: Promise<{ locale: string }> };

/** Shown when the session has no active organization (also the OAuth post-login step). */
export default async function SelectOrganizationPage({ params }: SelectOrganizationPageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  await requireAnySession({ locale });
  const t = await getTranslations("auth");
  return (
    <AuthCard title={t("selectOrganizationTitle")} description={t("selectOrganizationDescription")}>
      <OrganizationPicker />
      <Separator />
      <div className="grid gap-2">
        <h2 className="text-sm font-medium">{t("createOrganization")}</h2>
        <p className="text-sm text-muted-foreground">{t("createOrganizationDescription")}</p>
        <CreateOrganizationForm />
      </div>
    </AuthCard>
  );
}
