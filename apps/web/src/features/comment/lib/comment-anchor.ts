/** The order page's Comments section (ADR 0115). */
export const COMMENTS_ANCHOR = "comments";

/** The hash prefix that opens the composer on one line: `#comment-<lineId>`. */
export const LINE_COMMENT_PREFIX = "comment-";

export type CommentAnchorInput = { lineId?: string | null };

/** The hash for the order's comments, or for one line's (the composer picks that line). */
export function commentAnchor({ lineId }: CommentAnchorInput = {}): string {
  return lineId ? `${LINE_COMMENT_PREFIX}${lineId}` : COMMENTS_ANCHOR;
}

export type LineOfHashInput = { hash: string };

/** The line a `#comment-<lineId>` hash names; null for any other hash. */
export function lineOfHash({ hash }: LineOfHashInput): string | null {
  const value = hash.replace(/^#/, "");
  return value.startsWith(LINE_COMMENT_PREFIX) ? value.slice(LINE_COMMENT_PREFIX.length) : null;
}
