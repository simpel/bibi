import { Separator, SidebarInset, SidebarProvider, SidebarTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { CrumbNamesProvider } from "@/components/shell/crumb-names";
import type { ShellUser } from "@/components/shell/shell-types";
import { AdminSidebar } from "./admin-sidebar";

export type AdminShellProps = {
  user: ShellUser;
  organizationId: string;
  children: ReactNode;
};

/** Superadmin layout (ADR 0015): shadcn sidebar + inset content, separate from the app shell. */
export function AdminShell({ user, organizationId, children }: AdminShellProps) {
  const t = useTranslations("admin");
  return (
    <SidebarProvider>
      <AdminSidebar user={user} organizationId={organizationId} />
      <SidebarInset>
        <CrumbNamesProvider>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger label={t("toggleSidebar")} />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb />
          </header>
          <div className="min-w-0 flex-1 p-4 md:p-6">{children}</div>
        </CrumbNamesProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
