"use client";

import { Badge, DataTableRowActions } from "@bibi/ui";
import { PencilIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { RelativeTime } from "@/components/relative-time";
import type { CommentView } from "./comment-view";
import { DeleteCommentDialog } from "./delete-comment-dialog";
import { EditCommentForm } from "./edit-comment-form";

export type CommentItemProps = { comment: CommentView };

/** One comment: author, time, the line it is about and the text; the author edits it in place. */
export function CommentItem({ comment }: CommentItemProps) {
  const t = useTranslations("comment");
  const common = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const actions = [
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
  return (
    <li data-slot="comment-item" className="grid gap-1 py-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">{comment.authorName ?? t("formerMember")}</span>
        <span className="text-muted-foreground">
          <RelativeTime instant={comment.createdAt} />
          {comment.edited ? ` · ${t("edited")}` : null}
        </span>
        {comment.lineName ? (
          <Badge variant="secondary">{t("onLine", { name: comment.lineName })}</Badge>
        ) : null}
        {actions.length > 0 && !editing ? (
          <div className="ml-auto">
            <DataTableRowActions label={common("actions")} primary={actions} />
          </div>
        ) : null}
      </div>
      {editing ? (
        <EditCommentForm id={comment.id} body={comment.body} onDone={() => setEditing(false)} />
      ) : (
        <p className="whitespace-pre-line text-sm">{comment.body}</p>
      )}
      <DeleteCommentDialog id={comment.id} open={deleting} onOpenChange={setDeleting} />
    </li>
  );
}
