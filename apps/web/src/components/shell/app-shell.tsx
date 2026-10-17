import type { ReactNode } from "react";
import { AssistantProvider } from "@/features/assistant/state/assistant-provider";
import { AssistantPanel } from "@/features/assistant/ui/assistant-panel";
import type { ShellAccess, ShellUser } from "./shell-types";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  children: ReactNode;
};

/** Authenticated layout: sidebar (desktop), top bar, content and the persistent assistant panel. */
export function AppShell({ organizationId, user, access, children }: AppShellProps) {
  return (
    <AssistantProvider>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r bg-card md:block">
          <Sidebar organizationId={organizationId} user={user} access={access} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar organizationId={organizationId} user={user} access={access} />
          <main className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
        <AssistantPanel />
      </div>
    </AssistantProvider>
  );
}
