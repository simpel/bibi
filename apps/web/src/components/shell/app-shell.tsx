import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import type { ShellAccess, ShellUser } from "./shell-types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  children: ReactNode;
};

/** Authenticated layout: sidebar (desktop), top bar, and content; the assistant itself lives on the start page. */
export function AppShell({ organizationId, user, access, children }: AppShellProps) {
  return (
    <AssistantProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r bg-card md:block">
          <Sidebar organizationId={organizationId} user={user} access={access} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar organizationId={organizationId} user={user} access={access} />
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </AssistantProvider>
  );
}
