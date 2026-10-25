import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { type DayTotal, sharesOf } from "./day-value";

const tint = ({ token, percent }: { token: string; percent: number }) =>
  `color-mix(in oklch, var(${token}) ${percent}%, transparent)`;

/**
 * As the legend reads them: booked green, prebooked hatched amber, and what is still open red,
 * money left on the table.
 */
export const VALUE_FILLS: Record<"booked" | "prebooked" | "open", CSSProperties> = {
  booked: { backgroundColor: "var(--success)" },
  prebooked: {
    backgroundImage: `repeating-linear-gradient(135deg, ${tint({ token: "--warning", percent: 70 })} 0 3px, ${tint({ token: "--warning", percent: 25 })} 3px 6px)`,
  },
  open: { backgroundColor: tint({ token: "--destructive", percent: 45 }) },
};

/** A day's value as one bar: booked, then prebooked, then what is still open. */
export function DayValueBar({ total, className }: { total: DayTotal; className?: string }) {
  const shares = sharesOf({ total });
  return (
    <span aria-hidden className={cn("flex h-1 w-full overflow-hidden", className)}>
      {(["booked", "prebooked", "open"] as const).map((part) =>
        shares[part] > 0 ? (
          <span
            key={part}
            className="h-full"
            style={{ width: `${shares[part] * 100}%`, ...VALUE_FILLS[part] }}
          />
        ) : null,
      )}
    </span>
  );
}
