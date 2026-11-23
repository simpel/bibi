import { Separator, SidebarTrigger } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TourReplayButton } from "@/components/tour/tour-replay-button";
import { NotificationBell } from "@/features/notification/ui/notification-bell";
import { Breadcrumb } from "./breadcrumb";
import { CommandBar } from "./command-bar";
import { HeaderCreateOrderButton } from "./header-create-order-button";
import type { ShellAccess } from "./shell-types";

export type TopBarProps = { access: ShellAccess };

/**
 * Three columns: sidebar toggle and breadcrumb on the left, the ⌘K command bar in the middle,
 * the primary Create order button and the notifications bell on the right. All three share the
 * width (the search at most 28rem), so the search stays centred and shrinks with the window; the
 * right column never gets less than its buttons need, so the search and the breadcrumb give way. Below `md` it is a row: the breadcrumb takes the room, the search a
 * small pill (magnifier and ⌘K).
 */
export function TopBar({ access }: TopBarProps) {
  const common = useTranslations("common");
  const tour = useTranslations("tour");
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(6rem,1.5fr)_minmax(max-content,1fr)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger label={common("showSidebar")} closeLabel={common("hideSidebar")} />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb />
      </div>
      <div className="flex min-w-0 shrink-0 justify-center md:mx-auto md:w-full md:max-w-md">
        <CommandBar permissions={access.permissions} />
      </div>
      <div className="flex shrink-0 items-center justify-end gap-2">
        <HeaderCreateOrderButton access={access} />
        <TourReplayButton label={tour("replay")} />
        <NotificationBell />
      </div>
    </header>
  );
}
