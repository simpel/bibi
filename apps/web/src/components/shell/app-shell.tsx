import type { ReactNode } from "react";
import { AssistantPanelSlot } from "./assistant-panel-slot";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

export type AppShellProps = {
  organizationId: string;
  user: { name: string; email: string };
  children: ReactNode;
};

/** Authenticated layout: sidebar (desktop), top bar, content, assistant panel slot. */
export function AppShell({ organizationId, user, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        <Sidebar organizationId={organizationId} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar organizationId={organizationId} user={user} />
        <main id="main" className="flex-1 p-4 sm:p-6">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
      <AssistantPanelSlot />
    </div>
  );
}
