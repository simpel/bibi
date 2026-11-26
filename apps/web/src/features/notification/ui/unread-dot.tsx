import { cn } from "@bibi/ui";

export type DotUrgency = "unread" | "urgent";

/**
 * The red dot's variants (tokens only): plain for something unread, with a pulsing ring for
 * something that needs the member now. The ring pulses unless the member asked for less motion;
 * the dot itself always stays. (`cva` is not a web dependency, so the variants are a typed map.)
 */
export const UNREAD_DOT_VARIANTS: Record<DotUrgency, string> = {
  unread: "",
  urgent:
    "before:absolute before:inset-0 before:rounded-full before:bg-destructive before:opacity-75 before:content-[''] motion-safe:before:animate-ping",
};

export type UnreadDotProps = { label: string; urgency?: DotUrgency; className?: string };

/** The red dot of something unread or urgent, with its meaning for screen readers. */
export function UnreadDot({ label, urgency = "unread", className }: UnreadDotProps) {
  return (
    <span
      className={cn(
        "relative block size-2 rounded-full bg-destructive",
        UNREAD_DOT_VARIANTS[urgency],
        className,
      )}
    >
      <span className="sr-only">{label}</span>
    </span>
  );
}
