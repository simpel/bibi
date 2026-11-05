import { PageContainer, PageSection } from "@bibi/ui";
import type { ReactNode } from "react";
import { financeToday } from "@/features/finance/finance-path";
import { visibleDashboards } from "../dashboard-path";
import { DashboardsHeader } from "./dashboards-header";

/**
 * The frame of every dashboard: the header and tabs on a soft muted background,
 * with all dashboard cards rendered in crisp white.
 */
export async function DashboardsShell({ children }: { children: ReactNode }) {
  const [today, dashboards] = await Promise.all([financeToday(), visibleDashboards()]);
  return (
    <div className="min-h-full bg-muted/40 pb-12">
      <PageSection>
        <PageContainer className="pb-6 sm:pb-8">
          <DashboardsHeader today={today} dashboards={dashboards} />
        </PageContainer>
      </PageSection>
      <PageSection>
        <PageContainer>
          <div data-slot="dashboards-content">{children}</div>
        </PageContainer>
      </PageSection>
    </div>
  );
}
