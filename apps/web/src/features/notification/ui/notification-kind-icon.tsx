import type { NotificationKind } from "@bibi/core/schemas";
import { BanknoteIcon, ClipboardListIcon, RefreshCwIcon, UserRoundCheckIcon } from "lucide-react";

const ICONS = {
  ASSIGNED: UserRoundCheckIcon,
  WORK_ORDER_SENT: ClipboardListIcon,
  TICKET_STATUS_CHANGED: RefreshCwIcon,
  PAYMENT_RECEIVED: BanknoteIcon,
} as const satisfies Record<NotificationKind, unknown>;

/** The kind's icon in a notification row; the kind's name is in the row's kind column. */
export function NotificationKindIcon({ kind }: { kind: NotificationKind }) {
  const Icon = ICONS[kind];
  return <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />;
}
