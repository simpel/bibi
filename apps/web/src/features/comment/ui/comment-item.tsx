"use client";

import { Badge, DataTableRowActions } from "@bibi/ui";
import { PencilIcon, ReplyIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import type { Mentionable } from "../lib/mentions";
import { CommentBody } from "./comment-body";
import type { CommentView } from "./comment-view";
import { DeleteCommentDialog } from "./delete-comment-dialog";
import { EditCommentForm } from "./edit-comment-form";

export type CommentItemProps = {
  comment: CommentView;
  /** Name the line the comment is about; off where every comment is about one line. */
  showLine?: boolean;
  /** Who can be mentioned when the author edits it. */
  people: readonly Mentionable[];
  /** Opens the reply box under the thread: a Reply button before Edit; absent for replies and readers. */
  onReply?: (() => void) | undefined;
};

/** One comment: author, time, the line it is about and the text; the author edits it in place. */
export function CommentItem({ comment, showLine = true, people, onReply }: CommentItemProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const actions = [
    ...(onReply ? [{ label: t("reply"), icon: ReplyIcon, onClick: onReply }] : []),
    ...(comment.canEdit
      ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setEditing(true) }]
      : []),
    ...(comment.canDelete
      ? [
          {
            label: t("delete"),
            icon: Trash2Icon,
            destructive: true,
            onClick: () => setDeleting(true),
          },
        ]
      : []),
  ];
  const known = [...people, ...comment.mentions];
  return (
    <div data-slot="comment-item" className="grid gap-1 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">{comment.authorName ?? t("formerMember")}</span>
        <span className="text-muted-foreground">
          <RelativeTime instant={comment.createdAt} />
          {comment.edited ? ` · ${t("edited")}` : null}
        </span>
        {showLine && comment.lineName ? (
          <Badge variant="secondary">{t("onLine", { name: comment.lineName })}</Badge>
        ) : null}
        {actions.length > 0 && !editing ? (
          <div className="ml-auto">
            <DataTableRowActions label={common("actions")} primary={actions} />
          </div>
        ) : null}
      </div>
      {editing ? (
        <EditCommentForm
          id={comment.id}
          body={comment.body}
          people={known}
          onDone={() => setEditing(false)}
        />
      ) : (
        <CommentBody body={comment.body} names={comment.mentions.map((m) => m.name)} />
      )}
      <DeleteCommentDialog id={comment.id} open={deleting} onOpenChange={setDeleting} />
    </div>
  );
}
