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
 * the primary Create order button and the notifications bell on the right. The outer columns share the rest of the width equally,
 * so the search stays centred; when the right column needs more room than its share, the search
 * and the breadcrumb give way, never the buttons. Below `md` it is a row: the breadcrumb takes the room, the search a
 * fixed narrow width.
 */
export function TopBar({ access }: TopBarProps) {
  const t = useTranslations("nav");
  const tour = useTranslations("tour");
  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(6rem,28rem)_minmax(max-content,1fr)]">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger label={t("openMenu")} />
        <Separator orientation="vertical" className="h-4" />
        <Breadcrumb />
      </div>
      <div className="flex w-32 min-w-0 shrink-0 justify-center sm:w-56 md:w-full">
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
