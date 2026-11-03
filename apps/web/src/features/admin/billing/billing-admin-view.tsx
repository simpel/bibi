import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { platformOperations } from "@/server/platform-operations";
import { runPlatformOperation } from "@/server/run-platform-operation";
import { ConfigCard } from "./config-card";
import { OrganizationPager } from "./organization-pager";
import { OrganizationTable } from "./organization-table";

export type BillingAdminViewProps = { locale: Locale; cursor: string | undefined };

/** `/mothership/billing` (ADR 0095 §1): Bibi's Stripe setup and every organization's billing. */
export async function BillingAdminView({ locale, cursor }: BillingAdminViewProps) {
  const t = await getTranslations("admin.billing");
  const ops = platformOperations();
  const [config, organizations] = await Promise.all([
    runPlatformOperation({ operation: ops.getBillingConfig, input: {} }),
    runPlatformOperation({ operation: ops.listBillingOrganizations, input: { cursor } }),
  ]);
  const header = <PageHeader title={t("title")} description={t("description")} />;
  const error = !config.ok ? config.error : !organizations.ok ? organizations.error : null;
  if (error || !config.ok || !organizations.ok) {
    return (
      <div className="grid gap-6">
        {header}
        {error ? <ErrorState errorKey={handleLoadError({ error, locale })} /> : null}
      </div>
    );
  }
  return (
    <div className="grid gap-6">
      {header}
      <ConfigCard config={config.value} />
      <section className="grid gap-3">
        <h2 className="text-base">{t("organizations.title")}</h2>
        <OrganizationTable organizations={organizations.value.items} />
        <OrganizationPager cursor={cursor} nextCursor={organizations.value.nextCursor} />
      </section>
    </div>
  );
}
