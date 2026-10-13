import { useTranslations } from "next-intl";
import { OrgSwitcher } from "./org-switcher";
import { SidebarNav } from "./sidebar-nav";

export type SidebarProps = { organizationId: string };

/** Sidebar content, shared by the desktop rail and the mobile sheet. */
export function Sidebar({ organizationId }: SidebarProps) {
  const t = useTranslations("common");
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <span className="px-3 font-serif text-xl font-semibold">{t("appName")}</span>
      <OrgSwitcher organizationId={organizationId} />
      <SidebarNav />
    </div>
  );
}
