import type { IntegrationProvider } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { ExternalLinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/** Each provider's own page on what a venue sets up before connecting (opened in a new tab). */
const HELP_URLS: Record<IntegrationProvider, string> = {
  STRIPE: "https://support.stripe.com/questions/know-your-customer-obligations",
  SWISH: "https://www.swish.nu/faq/company",
  FORTNOX: "https://www.fortnox.se/integrationer",
  VISMA: "https://www.spiris.se/integrationer",
};

export type ProviderHelpLinkProps = { provider: IntegrationProvider; className?: string };

/** "How to connect": the provider's guide, the left-hand button beside Connect. */
export function ProviderHelpLink({ provider, className }: ProviderHelpLinkProps) {
  const t = useTranslations("integration.card");
  return (
    <Button asChild variant="outline" className={className}>
      <a href={HELP_URLS[provider]} target="_blank" rel="noreferrer">
        {t("howToConnect")}
        <ExternalLinkIcon aria-hidden />
      </a>
    </Button>
  );
}
