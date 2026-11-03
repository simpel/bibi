"use client";

import { Button, cn } from "@bibi/ui";
import { MailCheckIcon, MailIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { RelativeTime } from "@/components/relative-time";

export type ActivityTimeCellProps = {
  instant: Date | string;
  read: boolean;
  /** Left out without the permission to change the read state. */
  onToggleRead?: () => void;
  /** Left out without the permission to delete; it opens a confirmation. */
  onDelete?: () => void;
};

type IconActionProps = {
  label: string;
  onClick: () => void;
  className?: string;
  children: ReactNode;
};

/** One quick action as an icon; the row's own click stays out. */
function IconAction({ label, onClick, className, children }: IconActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      aria-label={label}
      title={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </Button>
  );
}

/** When, then the row's two quick actions as icons: mark read or unread, and delete. */
export function ActivityTimeCell({ instant, read, onToggleRead, onDelete }: ActivityTimeCellProps) {
  const t = useTranslations("common");
  const toggleLabel = read ? t("markUnread") : t("markRead");
  return (
    <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
      <span className="mr-1 whitespace-nowrap">
        <RelativeTime instant={instant} />
      </span>
      {onToggleRead ? (
        <IconAction label={toggleLabel} onClick={onToggleRead}>
          {read ? <MailIcon /> : <MailCheckIcon />}
        </IconAction>
      ) : null}
      {onDelete ? (
        <IconAction label={t("delete")} onClick={onDelete} className="hover:text-destructive">
          <Trash2Icon />
        </IconAction>
      ) : null}
    </div>
  );
}
