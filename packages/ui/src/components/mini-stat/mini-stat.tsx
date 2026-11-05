import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type MiniStatProps = {
  /** A word or two, e.g. "Value". */
  label: string;
  value: ReactNode;
  /** The full text when `value` is cut short, e.g. a long room name. */
  title?: string;
  className?: string;
};

/** One tiny figure under its label, for a row of facts to scan at a glance. */
export function MiniStat({ label, value, title, className }: MiniStatProps) {
  return (
    <div data-slot="mini-stat" title={title} className={cn("min-w-0 flex-1 basis-0", className)}>
      <p className="truncate text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="truncate font-semibold text-sm tabular-nums leading-tight">{value}</p>
    </div>
  );
}

export type MiniStatRowProps = { children: ReactNode; className?: string };

/** Mini stats side by side, divided from the rest of the card by a rule. */
export function MiniStatRow({ children, className }: MiniStatRowProps) {
  return (
    <div
      data-slot="mini-stat-row"
      className={cn("flex gap-3 border-y border-border/60 py-2", className)}
    >
      {children}
    </div>
  );
}
