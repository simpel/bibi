import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  Wordmark,
} from "@okazi/ui";
import { useTranslations } from "next-intl";
import { AssistantNav } from "./assistant-nav";
import { PlatformAdminCard } from "./platform-admin-card";
import type { ShellAccess, ShellUser } from "./shell-types";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export type AppSidebarProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
};

/**
 * The app's shadcn sidebar (ADR 0036): the assistant on top, then the daily work in collapsible
 * Work and Catalog groups; Administration (members, API keys, settings), the superadmin card
 * (sidebar-06) and the account at the bottom. A sheet on mobile, hidden or shown with the top bar's trigger.
 */
export function AppSidebar({ organizationId, user, access }: AppSidebarProps) {
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const shell = useTranslations("shell");
  return (
    <Sidebar mobileTitle={nav("openMenu")} mobileDescription={nav("openMenu")}>
      <SidebarHeader className="flex items-center">
        <Wordmark className="px-2 py-1.5" size="lg" name={common("appName")}>
          {common("appName")}
        </Wordmark>
      </SidebarHeader>
      <SidebarContent>
        <AssistantNav />
        <nav aria-label={shell("mainNavigation")}>
          <SidebarNav groups={["primary"]} access={access} headings={false} />
          <SidebarNav groups={["work", "catalog"]} access={access} headings />
        </nav>
      </SidebarContent>
      <SidebarFooter>
        <nav aria-label={shell("adminNavigation")}>
          <SidebarNav groups={["admin"]} access={access} headings={false} />
        </nav>
        {access.platformAdmin ? <PlatformAdminCard /> : null}
        <UserMenu user={user} organizationId={organizationId} />
      </SidebarFooter>
      <SidebarRail label={nav("openMenu")} />
    </Sidebar>
  );
}
