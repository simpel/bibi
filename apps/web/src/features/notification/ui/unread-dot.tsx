import { cn } from "@bibi/ui";

export type UnreadDotProps = { label: string; className?: string };

/** The red dot of something unread, with its meaning for screen readers. */
export function UnreadDot({ label, className }: UnreadDotProps) {
  return (
    <span className={cn("block size-2 rounded-full bg-destructive", className)}>
      <span className="sr-only">{label}</span>
    </span>
  );
}
