import { SidebarInset, SidebarProvider } from "@bibi/ui";
import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import { CrumbNamesProvider } from "./crumb-names";
import type { NotificationBellData, ShellAccess, ShellUser } from "./shell-types";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  bell: NotificationBellData;
  children: ReactNode;
};

/** Authenticated layout: shadcn sidebar, top bar and content; the assistant itself lives on the start page. */
export function AppShell({ organizationId, user, access, bell, children }: AppShellProps) {
  return (
    <AssistantProvider>
      <CrumbNamesProvider>
        <SidebarProvider>
          <AppSidebar organizationId={organizationId} user={user} access={access} />
          <SidebarInset className="min-w-0">
            <TopBar organizationId={organizationId} access={access} bell={bell} />
            <main className="min-w-0 flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </CrumbNamesProvider>
    </AssistantProvider>
  );
}
