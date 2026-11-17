import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  Wordmark,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { TrialCountdown } from "@/features/billing/lib/trial-countdown";
import { TrialCountdownCard } from "@/features/billing/ui/trial-countdown-card";
import { AdminNav } from "./admin-nav";
import { AssistantNav } from "./assistant-nav";
import { NewOrderButton } from "./new-order-button";
import { PlatformAdminCard } from "./platform-admin-card";
import type { ShellAccess, ShellUser } from "./shell-types";
import { SidebarMode } from "./sidebar-mode";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export type AppSidebarProps = {
  organizationId: string;
  user: ShellUser;
  access: ShellAccess;
  trial: TrialCountdown | null;
};

/**
 * The app's shadcn sidebar (ADR 0036): the assistant on top, then the daily work in collapsible
 * Work and Catalog groups; the Administration entry, the superadmin card (sidebar-06) and the
 * account at the bottom. Inside `/admin/*` the middle swaps to the administration area's own
 * groups. A sheet on mobile; on desktop the top bar's trigger collapses it to icons, each with a
 * tooltip. While the free trial runs, its countdown sits above the account.
 */
export function AppSidebar({ organizationId, user, access, trial }: AppSidebarProps) {
  const common = useTranslations("common");
  const nav = useTranslations("nav");
  const shell = useTranslations("shell");
  return (
    <Sidebar collapsible="icon" mobileTitle={nav("openMenu")} mobileDescription={nav("openMenu")}>
      <SidebarHeader className="flex flex-col items-stretch gap-2">
        <Wordmark
          size="lg"
          className="my-4 group-data-[collapsible=icon]:hidden"
          label={common("appName")}
        />
        <Wordmark
          size="md"
          variant="initial"
          className="mx-auto my-5 hidden group-data-[collapsible=icon]:block"
          label={common("appName")}
        />
        <SidebarMode admin={null}>
          <NewOrderButton access={access} />
        </SidebarMode>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMode
          admin={
            <nav aria-label={shell("adminNavigation")}>
              <AdminNav access={access} />
            </nav>
          }
        >
          <AssistantNav />
          <nav aria-label={shell("mainNavigation")}>
            <SidebarNav groups={["primary"]} access={access} headings={false} />
            <SidebarNav groups={["work", "catalog"]} access={access} headings />
          </nav>
        </SidebarMode>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMode admin={null}>
          <nav aria-label={shell("adminNavigation")}>
            <SidebarNav groups={["admin"]} access={access} headings={false} />
          </nav>
        </SidebarMode>
        {trial ? <TrialCountdownCard trial={trial} /> : null}
        {access.platformAdmin ? <PlatformAdminCard /> : null}
        <UserMenu user={user} organizationId={organizationId} />
      </SidebarFooter>
      <SidebarRail label={nav("openMenu")} />
    </Sidebar>
  );
}
