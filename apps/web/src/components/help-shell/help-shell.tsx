import {
  Button,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@bibi/ui";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/shell/breadcrumb";
import { CrumbNamesProvider } from "@/components/shell/crumb-names";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { HelpNav, type HelpNavGroup } from "./help-nav";

export type HelpShellLabels = {
  title: string;
  description: string;
  toggleSidebar: string;
  signIn: string;
};

export type HelpShellProps = {
  labels: HelpShellLabels;
  homeHref: string;
  icon: LucideIcon;
  nav: HelpNavGroup[];
  /** The sibling surface (`/support` ↔ `/developers`), shown in the top bar. */
  crossLink: { href: string; label: string };
  children: ReactNode;
};

/** Public help layout for `/support` and `/developers`: app sidebar primitives, no session read. */
export function HelpShell({
  labels,
  homeHref,
  icon: Icon,
  nav,
  crossLink,
  children,
}: HelpShellProps) {
  return (
    <SidebarProvider>
      <Sidebar mobileTitle={labels.title} mobileDescription={labels.description}>
        <SidebarHeader>
          <Link href={homeHref} className="flex items-center gap-2 px-2 py-1.5 font-semibold">
            <Icon className="size-4 shrink-0" />
            <span className="truncate">{labels.title}</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <HelpNav groups={nav} />
        </SidebarContent>
        <SidebarRail label={labels.toggleSidebar} />
      </Sidebar>
      <SidebarInset>
        <CrumbNamesProvider>
          <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger label={labels.toggleSidebar} />
            <Separator orientation="vertical" className="h-4" />
            <div className="min-w-0 flex-1">
              <Breadcrumb />
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href={crossLink.href}>{crossLink.label}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={ROUTES.login}>{labels.signIn}</Link>
            </Button>
          </header>
          <div className="min-w-0 flex-1 p-4 md:p-8">{children}</div>
        </CrumbNamesProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
