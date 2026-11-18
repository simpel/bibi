import type { MyWorkTask } from "@bibi/core";
import { SidebarInset, SidebarProvider } from "@bibi/ui";
import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import type { TrialCountdown } from "@/features/billing/lib/trial-countdown";
import { NotificationLiveProvider } from "@/features/notification/ui/notification-live-provider";
import { NotificationPanel } from "@/features/notification/ui/notification-panel";
import { NotificationPanelProvider } from "@/features/notification/ui/notification-panel-provider";
import { CrumbNamesProvider } from "./crumb-names";
import { PermissionsProvider } from "./permissions-context";
import type { ShellAccess, ShellCounts, ShellUser } from "./shell-types";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  counts: Promise<ShellCounts>;
  /** Needs you, still being read, for the notification panel (null without `order:read`). */
  needsYou: Promise<MyWorkTask[] | null>;
  /** The free trial's countdown for the sidebar foot, null once paid, exempt or over. */
  trial: TrialCountdown | null;
  children: ReactNode;
};

/**
 * Authenticated layout: shadcn sidebar, top bar, content and the notification panel on the right;
 * the assistant itself lives on the assistant page. The live notification state wraps it all, for
 * the bell, the panel and the list (ADR 0094).
 */
export function AppShell({
  organizationId,
  user,
  access,
  counts,
  needsYou,
  trial,
  children,
}: AppShellProps) {
  return (
    <PermissionsProvider permissions={access.permissions}>
      <AssistantProvider>
        <NotificationLiveProvider organizationId={organizationId} counts={counts}>
          <NotificationPanelProvider needsYou={needsYou}>
            <CrumbNamesProvider>
              <SidebarProvider>
                <AppSidebar
                  organizationId={organizationId}
                  user={user}
                  access={access}
                  trial={trial}
                />
                <SidebarInset className="min-w-0">
                  <TopBar access={access} />
                  <main className="min-w-0 flex-1">{children}</main>
                </SidebarInset>
                <NotificationPanel />
              </SidebarProvider>
            </CrumbNamesProvider>
          </NotificationPanelProvider>
        </NotificationLiveProvider>
      </AssistantProvider>
    </PermissionsProvider>
  );
}
