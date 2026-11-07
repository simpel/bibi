import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import { pageTitle } from "@/lib/page-metadata";

type ApiKeysPageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: ApiKeysPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "apiKeys" });
}

/** Administration → Integrations → API keys for the REST API (ADR 0050). */
export default async function ApiKeysPage({ params }: ApiKeysPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <ApiKeySection locale={locale} inTab />;
}
