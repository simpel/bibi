import { SidebarMenuBadge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useNotificationLive } from "@/features/notification/ui/notification-live-context";
import type { NavBadgeKind } from "./nav-items";

/** Above this the badge shows "99+". */
const MAX = 99;

/** The screen reader text per badge, under `nav`. */
const LABELS = { inbox: "inboxOpen", myWork: "myWorkDue" } as const satisfies Record<
  NavBadgeKind,
  string
>;

/**
 * A sidebar entry's live count (ADR 0094): open inbox messages, or Needs you tasks due now on
 * My work; nothing at zero. Collapsed
 * to icons the count gives way to a red dot on the icon.
 */
export function NavBadge({ kind }: { kind: NavBadgeKind }) {
  const t = useTranslations("nav");
  const { inboxOpen, myWorkDue } = useNotificationLive();
  const count = kind === "inbox" ? inboxOpen : myWorkDue;
  if (!count) return null;
  return (
    <>
      <SidebarMenuBadge className="rounded-full bg-destructive text-destructive-foreground peer-hover/menu-button:text-destructive-foreground peer-data-[active=true]/menu-button:text-destructive-foreground">
        <span aria-hidden>{count > MAX ? `${MAX}+` : count}</span>
        <span className="sr-only">{t(LABELS[kind], { count })}</span>
      </SidebarMenuBadge>
      <span
        aria-hidden
        className="pointer-events-none absolute top-1 right-1 hidden size-2 rounded-full bg-destructive ring-2 ring-sidebar group-data-[collapsible=icon]:block"
      />
    </>
  );
}
