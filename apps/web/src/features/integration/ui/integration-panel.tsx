import { listIntegrations } from "@bibi/core";
import type { IntegrationConnectionDto } from "@bibi/core/schemas";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { AdminSection } from "@/components/admin/admin-section";
import type { AdminSectionId } from "@/components/shell/admin-sections";
import { ErrorState } from "@/components/states/error-state";
import { StripeSection } from "@/features/payment-account/ui/stripe-section";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { FortnoxSection } from "./fortnox-section";
import type { IntegrationOutcome } from "./integration-notice";

export type IntegrationPanelProps = {
  locale: Locale;
  outcome: IntegrationOutcome | null;
  show: ReadonlySet<AdminSectionId>;
};

/** A provider the list has no row for yet: shown as not connected, connecting disabled. */
const NOT_CONNECTED: IntegrationConnectionDto = {
  id: null,
  organizationId: "",
  provider: "FORTNOX",
  status: "NOT_CONNECTED",
  configured: false,
  companyName: null,
  organizationNumber: null,
  connectedAt: null,
  updatedAt: null,
};

/**
 * Administration → Integrations (ADR 0087): every integration always has its section, connected
 * or not: Stripe (ADR 0090) and Fortnox.
 */
export async function IntegrationPanel({ locale, outcome, show }: IntegrationPanelProps) {
  const [t, abilities, list, dates] = await Promise.all([
    getTranslations("integration.fortnox"),
    getCallerAbilities(),
    runOperation({ operation: listIntegrations, input: {} }),
    getDateTimeFormat(),
  ]);
  const stripe = show.has("stripe") ? (
    <StripeSection
      locale={locale}
      canEdit={can({ abilities, permission: "paymentAccount:write" })}
    />
  ) : null;
  if (!show.has("fortnox")) return stripe;
  if (!list.ok) {
    return (
      <>
        {stripe}
        <AdminSection id="fortnox" title={t("name")}>
          <ErrorState inline errorKey={handleLoadError({ error: list.error, locale })} />
        </AdminSection>
      </>
    );
  }
  const fortnox = list.value.items.find((item) => item.provider === "FORTNOX") ?? NOT_CONNECTED;
  const connectedOn = fortnox.connectedAt ? dates.date({ instant: fortnox.connectedAt }) : null;
  return (
    <>
      {stripe}
      <FortnoxSection
        connection={fortnox}
        canEdit={can({ abilities, permission: "integration:write" })}
        connectedOn={connectedOn}
        outcome={outcome}
      />
    </>
  );
}
