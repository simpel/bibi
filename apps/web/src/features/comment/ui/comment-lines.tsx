import type { DateTimeFormat, RunSheetComment } from "@bibi/core/schemas";

export type CommentLinesProps = {
  comments: readonly RunSheetComment[];
  /** The viewer's date and time format. */
  dates: DateTimeFormat;
  /** Shown when the author is no longer a member. */
  formerMember: string;
};

/**
 * Comments as a run sheet shows them (ADR 0115): the text, then author and time, oldest first,
 * each reply indented under its comment.
 */
export function CommentLines({ comments, dates, formerMember }: CommentLinesProps) {
  if (comments.length === 0) return null;
  return (
    <ul data-slot="comment-lines" className="grid gap-1">
      {comments.map((comment) => (
        <li
          key={`${comment.createdAt}:${comment.body}`}
          className={comment.reply ? "pl-4 text-sm before:mr-1 before:content-['↳']" : "text-sm"}
        >
          <span className="whitespace-pre-line">{comment.body}</span>
          <span className="text-muted-foreground">
            {` · ${comment.authorName ?? formerMember}, ${dates.dateTime({ instant: comment.createdAt })}`}
          </span>
        </li>
      ))}
    </ul>
  );
}
