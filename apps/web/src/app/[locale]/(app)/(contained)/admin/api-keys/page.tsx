import { resolveLocale } from "@okazi/i18n";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import { can, getCallerAbilities } from "@/server/caller-abilities";

type ApiKeysPageProps = { params: Promise<{ locale: string }> };

/** API keys for the REST API (admins, ADR 0050). */
export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const t = await getTranslations("integration.apiKeys");
  if (!can({ abilities: await getCallerAbilities(), permission: "apiKey:read" }))
    return <ErrorState errorKey="forbidden" />;
  return (
    <div className="grid gap-8">
      <PageHeader title={t("title")} description={t("description")} />
      <ApiKeySection locale={locale} />
    </div>
  );
}
