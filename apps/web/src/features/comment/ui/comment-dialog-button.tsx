"use client";

import {
  CommentAction,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CommentThread } from "./comment-thread";
import { type OrderComments, subjectOf } from "./comment-view";
import { useMarkSeen } from "./use-mark-seen";

export type CommentDialogButtonProps = {
  comments: OrderComments;
  /** The line the comments are about; null = the whole order. */
  lineId: string | null;
  /** The line's or the order's name, for the dialog's title. */
  title: string;
};

/**
 * The comment icon of a line or the order (ADR 0115): the count and a red dot for the caller's
 * unread ones. It opens that line's (or the order's) comments with a text box to add one;
 * opening it reads the caller's notifications about them.
 */
export function CommentDialogButton({ comments, lineId, title }: CommentDialogButtonProps) {
  const t = useTranslations("comment");
  const [open, setOpen] = useState(false);
  const subject = subjectOf({ state: comments, lineId });
  const markSeen = useMarkSeen({ ids: subject.unreadIds });
  const count = subject.comments.length;
  const unread = subject.unreadIds.length;
  if (count === 0 && !comments.canWrite) return null;
  return (
    <>
      <CommentAction
        label={t("actionLabel", { count, unread })}
        count={count}
        unread={unread > 0}
        onClick={() => {
          setOpen(true);
          void markSeen();
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dialogTitle", { name: title })}</DialogTitle>
            <DialogDescription>{t("dialogDescription")}</DialogDescription>
          </DialogHeader>
          <CommentThread state={comments} lineId={lineId} />
        </DialogContent>
      </Dialog>
    </>
  );
}
