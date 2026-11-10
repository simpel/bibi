import { IntegrationProviderSchema } from "@bibi/core/schemas";
import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import { INTEGRATION_OUTCOMES } from "@/features/integration/ui/integration-notice";
import {
  IntegrationPanel,
  type ProviderOutcome,
} from "@/features/integration/ui/integration-panel";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ provider?: string; outcome?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "integrations" });
}

type ReturnedInput = { provider: string | undefined; outcome: string | undefined };

/** What a provider's callback route puts on the redirect (`?provider=&outcome=`); else nothing. */
function returnedOf({ provider, outcome }: ReturnedInput): ProviderOutcome | null {
  const key = IntegrationProviderSchema.options.find((known) => known === provider?.toUpperCase());
  const result = INTEGRATION_OUTCOMES.find((known) => known === outcome);
  return key && result ? { provider: key, outcome: result } : null;
}

export default async function IntegrationsPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale }, { provider, outcome }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "integrations" });
  return (
    <AdminSections title={title}>
      {show.has("providers") ? (
        <IntegrationPanel locale={locale} returned={returnedOf({ provider, outcome })} />
      ) : null}
      {show.has("apiKeys") ? <ApiKeySection locale={locale} /> : null}
    </AdminSections>
  );
}
