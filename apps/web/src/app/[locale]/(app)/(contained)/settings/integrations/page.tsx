import { resolveLocale } from "@okazi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import { can, getCallerAbilities } from "@/server/caller-abilities";

type IntegrationsPageProps = { params: Promise<{ locale: string }> };

/** API keys for the REST API (admins, ADR 0050). Connected apps are on `/profile`. */
export default async function IntegrationsPage({ params }: IntegrationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const t = await getTranslations("integration");
  if (!can({ abilities: await getCallerAbilities(), permission: "apiKey:view" }))
    return <ErrorState errorKey="forbidden" />;
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <ApiKeySection locale={locale} />
    </div>
  );
}
