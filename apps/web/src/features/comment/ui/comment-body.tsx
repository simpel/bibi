import { splitMentions } from "../lib/mentions";

export type CommentBodyProps = { body: string; names: readonly string[] };

/** A comment's text with line breaks kept and each `@Name` it mentions highlighted (ADR 0115). */
export function CommentBody({ body, names }: CommentBodyProps) {
  const parts = splitMentions({ text: body, names });
  return (
    <p className="whitespace-pre-line text-sm">
      {parts.map((part, index) =>
        part.mention ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts of one text never reorder
          <span key={index} className="font-medium text-primary">
            {part.text}
          </span>
        ) : (
          part.text
        ),
      )}
    </p>
  );
}
