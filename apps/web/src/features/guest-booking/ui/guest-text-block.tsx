export type GuestTextBlockProps = { text: string | null; className?: string };

/** A venue's own text (intro, policy) as written: line breaks kept, nothing interpreted. */
export function GuestTextBlock({ text, className }: GuestTextBlockProps) {
  if (!text) return null;
  return (
    <p className={`text-sm whitespace-pre-line text-muted-foreground ${className ?? ""}`}>{text}</p>
  );
}
