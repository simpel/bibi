/** One comment as the order page shows it, prepared on the server. */
export type CommentView = {
  id: string;
  body: string;
  /** The line it is about and its name; null = the whole order. */
  lineId: string | null;
  lineName: string | null;
  /** The comment this one replies to; null for a comment of its own. */
  parentCommentId: string | null;
  /** Colleagues mentioned with @, by name, for highlighting `@Name` in the text. */
  mentions: { userId: string; name: string }[];
  /** The author's name; null when they are no longer a member. */
  authorName: string | null;
  /** ISO time it was written. */
  createdAt: string;
  edited: boolean;
  /** The caller wrote it, so they may edit it. */
  canEdit: boolean;
  /** The caller wrote it or holds `comment:delete`. */
  canDelete: boolean;
};

/** A colleague the @ picker offers. */
export type MentionPerson = { userId: string; name: string };

/** A line the composer can comment on. */
export type CommentLineOption = { id: string; name: string };

/** One of the caller's unread comment notifications on the order (ADR 0115). */
export type UnreadComment = { id: string; lineId: string | null };

/** An order's comments as the page shows them, prepared once on the server (ADR 0115). */
export type OrderComments = {
  orderId: string;
  comments: CommentView[];
  /** The order's lines a comment can be about; empty without `program:read`. */
  lines: CommentLineOption[];
  /** Colleagues who can be mentioned with @; empty without `member:read`. */
  people: MentionPerson[];
  /** The caller's own unread comment notifications on the order: the red dots. */
  unread: UnreadComment[];
  canWrite: boolean;
};

export type SubjectInput = { state: OrderComments; lineId: string | null };

/** The comments and unread notifications about one line, or about the whole order (null). */
export function subjectOf({ state, lineId }: SubjectInput) {
  return {
    comments: state.comments.filter((comment) => comment.lineId === lineId),
    unreadIds: state.unread.filter((item) => item.lineId === lineId).map((item) => item.id),
  };
}
