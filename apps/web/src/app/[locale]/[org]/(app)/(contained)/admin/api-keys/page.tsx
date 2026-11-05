import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import { pageTitle } from "@/lib/page-metadata";
import { can, getCallerAbilities } from "@/server/caller-abilities";

type ApiKeysPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ApiKeysPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "apiKeys" });
}

/** API keys for the REST API (admins, ADR 0050). */
export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const t = await getTranslations("integration.apiKeys");
  if (!can({ abilities: await getCallerAbilities(), permission: "apiKey:read" }))
    return (
      <SimplePage>
        <ErrorState errorKey="forbidden" />
      </SimplePage>
    );
  return (
    <SimplePage>
      <div className="grid gap-8">
        <PageHeader title={t("title")} description={t("description")} />
        <ApiKeySection locale={locale} />
      </div>
    </SimplePage>
  );
}
