import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import {
  INTEGRATION_OUTCOMES,
  type IntegrationOutcome,
} from "@/features/integration/ui/integration-notice";
import { IntegrationPanel } from "@/features/integration/ui/integration-panel";

type IntegrationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ fortnox?: string }>;
};

/** The outcome Fortnox's callback route puts on the redirect; anything else is ignored. */
function outcomeOf({ value }: { value: string | undefined }): IntegrationOutcome | null {
  return INTEGRATION_OUTCOMES.find((outcome) => outcome === value) ?? null;
}

export default async function IntegrationsPage({ params, searchParams }: IntegrationsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const outcome = outcomeOf({ value: (await searchParams).fortnox });
  return (
    <SimplePage>
      <IntegrationPanel locale={locale} outcome={outcome} />
    </SimplePage>
  );
}
