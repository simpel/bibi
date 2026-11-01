import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { Card } from "../card/card";

export type StatTileProps = Omit<ComponentProps<"div">, "children"> & {
  label: string;
  /** Already formatted for the viewer (amount, count). */
  value: string;
  /** A short line under the value, e.g. a unit or a note. */
  hint?: string;
  /** Colours the value as a warning (for example overdue money). */
  tone?: "default" | "destructive";
};

/** One headline figure: a label over a large, preformatted value. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  className,
  ...props
}: StatTileProps) {
  return (
    <Card data-slot="stat-tile" className={cn("grid gap-1 p-4 shadow-none", className)} {...props}>
      <span className="text-xs text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-serif text-2xl font-light tracking-tight",
          tone === "destructive" && "text-destructive",
        )}
      >
        {value}
      </span>
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </Card>
  );
}
