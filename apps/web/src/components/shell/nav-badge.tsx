import { SidebarMenuBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNotificationLive } from "@/features/notification/ui/notification-live-context";
import type { NavBadgeKind } from "./nav-items";

/** Above this the badge shows "99+". */
const MAX = 99;

/**
 * A sidebar entry's live count (ADR 0094), e.g. open inbox messages; nothing at zero. Collapsed
 * to icons the count gives way to a red dot on the icon.
 */
export function NavBadge({ kind }: { kind: NavBadgeKind }) {
  const t = useTranslations("nav");
  const { inboxOpen } = useNotificationLive();
  const count = kind === "inbox" ? inboxOpen : null;
  if (!count) return null;
  return (
    <>
      <SidebarMenuBadge className="rounded-full bg-destructive text-destructive-foreground peer-hover/menu-button:text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground">
        <span aria-hidden>{count > MAX ? `${MAX}+` : count}</span>
        <span className="sr-only">{t("inboxOpen", { count })}</span>
      </SidebarMenuBadge>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 right-1 hidden size-2 rounded-full bg-destructive ring-2 ring-sidebar group-data-[collapsible=icon]:block"
      />
    </>
  );
}
