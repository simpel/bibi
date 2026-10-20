import { SidebarInset, SidebarProvider } from "@okazi/ui";
import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import { CrumbNamesProvider } from "./crumb-names";
import type { ShellAccess, ShellUser } from "./shell-types";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  children: ReactNode;
};

/** Authenticated layout: shadcn sidebar, top bar and content; the assistant itself lives on the start page. */
export function AppShell({ organizationId, user, access, children }: AppShellProps) {
  return (
    <AssistantProvider>
      <CrumbNamesProvider>
        <SidebarProvider>
          <AppSidebar organizationId={organizationId} user={user} access={access} />
          <SidebarInset className="min-w-0">
            <TopBar access={access} />
            <main className="min-w-0 flex-1">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </CrumbNamesProvider>
    </AssistantProvider>
  );
}
