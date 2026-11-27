import { IntegrationProviderSchema } from "@bibi/core/schemas";
import { resolveLocale } from "@bibi/i18n";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProviderDetail } from "@/features/integration/ui/provider-detail";
import { entityTitle } from "@/lib/page-metadata";

type PageProps = { params: Promise<{ locale: string; org: string; provider: string }> };

/** The URL carries the provider in lower case (`/admin/integrations/visma`); anything else is 404. */
function providerOf({ slug }: { slug: string }) {
  return IntegrationProviderSchema.options.find((known) => known === slug.toUpperCase()) ?? null;
}

export async function generateMetadata() {
  return entityTitle({ name: null, fallback: "Integration" });
}

export default async function IntegrationProviderPage({ params }: PageProps) {
  const { locale: rawLocale, org, provider: slug } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  const provider = providerOf({ slug });
  if (!provider) notFound();
  return <ProviderDetail locale={locale} org={org} provider={provider} />;
}
