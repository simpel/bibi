import type { Locale } from "@bibi/i18n";
import { PageContainer, PageSection } from "@bibi/ui";
import { financeToday } from "@/features/finance/finance-path";
import { periodHref } from "@/features/finance/lib/finance-href";
import type { Period } from "@/features/finance/lib/finance-period";
import { FinancialsTab } from "@/features/finance/ui/financials-tab";
import { redirect } from "@/lib/navigation";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { DASHBOARD_TABS, type DashboardTab, tabBase } from "../lib/dashboard-tabs";
import { DashboardHeader } from "./dashboard-header";
import { DashboardTabsNav } from "./dashboard-tabs-nav";
import { WorkloadTab } from "./workload-tab";

export type DashboardPageProps = {
  locale: Locale;
  /** The organization slug, for the redirect away from a tab the caller may not read. */
  org: string;
  tab: DashboardTab;
  period: Period;
  customerId: string | undefined;
};

/**
 * `/dashboard/{tab}/{from}/{to}` (ADR 0086): the header with the range on the page background,
 * then a white section with the tabs and the open tab. A tab the caller may not read is hidden.
 */
export async function DashboardPage(props: DashboardPageProps) {
  const { locale, org, tab, period, customerId } = props;
  const [abilities, today] = await Promise.all([getCallerAbilities(), financeToday()]);
  const tabs = DASHBOARD_TABS.filter(
    (each) => each !== "financials" || can({ abilities, permission: "finance:read" }),
  );
  if (!tabs.includes(tab)) {
    redirect({ href: periodHref({ ...period, base: tabBase({ tab: "workload" }) }), locale, org });
  }
  return (
    <>
      <PageSection>
        <PageContainer className="pb-6 sm:pb-8">
          <DashboardHeader tab={tab} period={period} today={today} customerId={customerId} />
        </PageContainer>
      </PageSection>
      <PageSection tone="card" divided>
        <PageContainer className="grid gap-6">
          <DashboardTabsNav tab={tab} tabs={tabs} period={period} />
          {tab === "financials" ? (
            <FinancialsTab locale={locale} period={period} today={today} customerId={customerId} />
          ) : (
            <WorkloadTab locale={locale} period={period} />
          )}
        </PageContainer>
      </PageSection>
    </>
  );
}
