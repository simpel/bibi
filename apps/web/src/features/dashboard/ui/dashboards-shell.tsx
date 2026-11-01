import { FlowMemory, PageContainer, PageSection } from "@bibi/ui";
import type { ReactNode } from "react";
import { financeToday } from "@/features/finance/finance-path";
import { visibleDashboards } from "../dashboard-path";
import { DashboardsHeader } from "./dashboards-header";
import { DashboardsContent, DashboardsPendingProvider } from "./dashboards-pending";

/**
 * The frame of every dashboard (ADR 0086): the header with the range and the tabs on the page
 * background, the open dashboard in the white section below. Kept across tab and range changes,
 * so only the content reloads: it stays on screen, pending, until the next is ready, and its
 * figures then count from the values `FlowMemory` keeps.
 */
export async function DashboardsShell({ children }: { children: ReactNode }) {
  const [today, dashboards] = await Promise.all([financeToday(), visibleDashboards()]);
  return (
    <FlowMemory>
      <DashboardsPendingProvider>
        <PageSection>
          <PageContainer className="pb-6 sm:pb-8">
            <DashboardsHeader today={today} dashboards={dashboards} />
          </PageContainer>
        </PageSection>
        <PageSection tone="card" divided>
          <PageContainer>
            <DashboardsContent>{children}</DashboardsContent>
          </PageContainer>
        </PageSection>
      </DashboardsPendingProvider>
    </FlowMemory>
  );
}
