import type { MyWorkTaskKind, NotificationKind } from "@bibi/core/schemas";
import {
  ArchiveIcon,
  ArrowRightLeftIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  HandCoinsIcon,
  HourglassIcon,
  InboxIcon,
  type LucideIcon,
  OctagonXIcon,
  ScrollTextIcon,
  TriangleAlertIcon,
  UserPlusIcon,
} from "lucide-react";

/**
 * One icon per thing a notification or a task is about, so a payment, a run sheet or a message
 * looks the same in the bell, the notifications page and Needs you. An area with a sidebar entry
 * uses that entry's icon (run sheets, inbox).
 */
export const SUBJECT_ICONS = {
  assignee: UserPlusIcon,
  status: ArrowRightLeftIcon,
  runSheet: ClipboardListIcon,
  payment: HandCoinsIcon,
  message: InboxIcon,
  quote: ScrollTextIcon,
  clash: OctagonXIcon,
  issue: TriangleAlertIcon,
  confirm: CalendarCheckIcon,
  hold: HourglassIcon,
  close: ArchiveIcon,
} satisfies Record<string, LucideIcon>;

export type Subject = keyof typeof SUBJECT_ICONS;

const NOTIFICATION_SUBJECTS: Record<NotificationKind, Subject> = {
  ASSIGNED: "assignee",
  RUN_SHEET_SENT: "runSheet",
  ORDER_STATUS_CHANGED: "status",
  PAYMENT_RECEIVED: "payment",
};

const TASK_SUBJECTS: Record<MyWorkTaskKind, Subject> = {
  HARD_CLASH: "clash",
  RUN_SHEET_BLOCKED: "runSheet",
  LINE_ISSUE: "issue",
  RUN_SHEET_UNSENT: "runSheet",
  UNCONFIRMED: "confirm",
  HOLD_EXPIRES: "hold",
  UNREAD_MESSAGES: "message",
  PAYMENT_OVERDUE: "payment",
  NOT_CLOSED: "close",
  QUOTE_WAITING: "quote",
};

/** The icon of a notification kind. */
export function notificationIcon({ kind }: { kind: NotificationKind }): LucideIcon {
  return SUBJECT_ICONS[NOTIFICATION_SUBJECTS[kind]];
}

/** The icon of a Needs you task kind. */
export function taskIcon({ kind }: { kind: MyWorkTaskKind }): LucideIcon {
  return SUBJECT_ICONS[TASK_SUBJECTS[kind]];
}
