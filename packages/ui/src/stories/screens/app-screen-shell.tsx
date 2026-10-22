import type { ReactNode } from "react";
import { Sidebar, SidebarInset, SidebarRail } from "../../components/sidebar/sidebar";
import { SidebarProvider } from "../../components/sidebar/sidebar-context";
import { AppScreenHeader } from "./app-screen-header";
import { AppSidebarFooter } from "./app-sidebar-footer";
import { AppSidebarHeader } from "./app-sidebar-header";
import { AppSidebarNav } from "./app-sidebar-nav";

export type NavItemKey =
  | "assistant"
  | "dashboard"
  | "pipeline"
  | "tickets"
  | "customers"
  | "calendar"
  | "items"
  | "venues"
  | "settings";

export type AppScreenShellProps = {
  activeNav: NavItemKey;
  pageTitle: string;
  breadcrumbs?: string[];
  headerActions?: ReactNode;
  children: ReactNode;
};

export function AppScreenShell({
  activeNav,
  pageTitle,
  breadcrumbs = [],
  headerActions,
  children,
}: AppScreenShellProps) {
  return (
    <SidebarProvider className="h-screen w-full overflow-hidden bg-background">
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <AppSidebarHeader />
        <AppSidebarNav activeNav={activeNav} />
        <AppSidebarFooter activeNav={activeNav} />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="flex h-screen flex-1 flex-col overflow-hidden">
        <AppScreenHeader
          pageTitle={pageTitle}
          breadcrumbs={breadcrumbs}
          headerActions={headerActions}
        />

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
