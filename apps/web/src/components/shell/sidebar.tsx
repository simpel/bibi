import { useTranslations } from "next-intl";
import { AssistantNav } from "./assistant-nav";
import type { ShellAccess, ShellUser } from "./shell-types";
import { SidebarNav } from "./sidebar-nav";
import { UserMenu } from "./user-menu";

export type SidebarProps = { organizationId: string; user: ShellUser; access: ShellAccess };

/**
 * Sidebar content, shared by the desktop rail and the mobile sheet (ADR 0036): the assistant
 * on top, daily work in the middle, settings, platform admin and the account bottom-left.
 */
export function Sidebar({ organizationId, user, access }: SidebarProps) {
  const t = useTranslations("common");
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <span className="px-3 font-serif text-xl font-semibold">{t("appName")}</span>
      <AssistantNav />
      <SidebarNav groups={["primary"]} label="mainNavigation" access={access} headings={false} />
      <SidebarNav groups={["work", "catalog"]} label="mainNavigation" access={access} headings />
      <div className="mt-auto grid gap-2 border-t pt-4">
        <SidebarNav groups={["admin"]} label="adminNavigation" access={access} headings={false} />
        <UserMenu user={user} organizationId={organizationId} />
      </div>
    </div>
  );
}
