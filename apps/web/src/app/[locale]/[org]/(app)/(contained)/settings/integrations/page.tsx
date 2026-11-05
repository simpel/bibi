import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import {
  INTEGRATION_OUTCOMES,
  type IntegrationOutcome,
} from "@/features/integration/ui/integration-notice";
import { IntegrationPanel } from "@/features/integration/ui/integration-panel";
import { pageTitle } from "@/lib/page-metadata";

type IntegrationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fortnox?: string }>;
};

export async function generateMetadata({ params }: IntegrationsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "integrations" });
}

/** The outcome Fortnox's callback route puts on the redirect; anything else is ignored. */
function outcomeOf({ value }: { value: string | undefined }): IntegrationOutcome | null {
  return INTEGRATION_OUTCOMES.find((outcome) => outcome === value) ?? null;
}

export default async function IntegrationsPage({ params, searchParams }: IntegrationsPageProps) {
  const [{ locale: rawLocale }, { fortnox }] = await Promise.all([params, searchParams]);
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const outcome = outcomeOf({ value: fortnox });
  return (
    <SimplePage>
      <IntegrationPanel locale={locale} outcome={outcome} />
    </SimplePage>
  );
}
