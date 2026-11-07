import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { AdminSections } from "@/components/admin/admin-sections";
import { loadAdminPage } from "@/components/admin/load-admin-page";
import { ApiKeySection } from "@/features/api-key/ui/api-key-section";
import {
  INTEGRATION_OUTCOMES,
  type IntegrationOutcome,
} from "@/features/integration/ui/integration-notice";
import { IntegrationPanel } from "@/features/integration/ui/integration-panel";
import { pageTitle } from "@/lib/page-metadata";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fortnox?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "integrations" });
}

/** The outcome Fortnox's callback route puts on the redirect; anything else is ignored. */
function outcomeOf({ value }: { value: string | undefined }): IntegrationOutcome | null {
  return INTEGRATION_OUTCOMES.find((outcome) => outcome === value) ?? null;
}

export default async function IntegrationsPage({ params, searchParams }: PageProps) {
  const [{ locale: rawLocale }, { fortnox }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const { title, show } = await loadAdminPage({ key: "integrations" });
  return (
    <AdminSections title={title}>
      <IntegrationPanel locale={locale} outcome={outcomeOf({ value: fortnox })} show={show} />
      {show.has("apiKeys") ? <ApiKeySection locale={locale} /> : null}
    </AdminSections>
  );
}
