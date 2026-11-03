import { Separator, SidebarTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { NotificationBell } from "@/features/notification/ui/notification-bell";
import { Breadcrumb } from "./breadcrumb";
import { CommandBar } from "./command-bar";
import type { NotificationBellData, ShellAccess } from "./shell-types";

export type TopBarProps = {
  organizationId: string;
  access: ShellAccess;
  bell: NotificationBellData;
};

/**
 * Three columns: sidebar toggle and breadcrumb on the left, the ⌘K command bar in the middle,
 * the notifications bell on the right. The outer columns share the rest of the width equally,
 * so the search stays centred. Below `md` it is a row: the breadcrumb takes the room, the search a
 * fixed narrow width.
 */
export function TopBar({ organizationId, access, bell }: TopBarProps) {
  const t = useTranslations("nav");
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,28rem)_minmax(0,1fr)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger label={t("openMenu")} />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb />
      </div>
      <div className="flex w-32 min-w-0 shrink-0 justify-center sm:w-56 md:w-full">
        <CommandBar permissions={access.permissions} />
      </div>
      <div className="flex shrink-0 justify-end">
        <NotificationBell
          unread={bell.unread}
          latest={bell.latest}
          organizationId={organizationId}
        />
      </div>
    </header>
  );
}
