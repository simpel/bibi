/** One comment as the order page shows it, prepared on the server. */
export type CommentView = {
  id: string;
  body: string;
  /** The line it is about; null = the whole order. */
  lineName: string | null;
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

/** A line the composer can comment on. */
export type CommentLineOption = { id: string; name: string };
