import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

export const dateLeafVariants = cva(
  "flex shrink-0 flex-col overflow-hidden rounded-lg border bg-card text-center shadow-xs",
  {
    variants: {
      size: {
        sm: "w-12",
        md: "w-16",
      },
    },
    defaultVariants: { size: "sm" },
  },
);

const BAND = { sm: "py-px text-[0.5625rem]", md: "py-0.5 text-[0.625rem]" } as const;
const NUMBER = { sm: "text-xl leading-7", md: "text-3xl leading-10" } as const;
const WEEKDAY = { sm: "pb-1 text-[0.5625rem]", md: "pb-1.5 text-[0.6875rem]" } as const;

export type DateLeafProps = VariantProps<typeof dateLeafVariants> & {
  /** Plain date key "YYYY-MM-DD". */
  date: string;
  locale?: string;
  /** Show the year in the band: only when it is not the current year, or on customer pages. */
  withYear?: boolean;
  className?: string;
};

function parts({ date, locale }: { date: string; locale: string }) {
  // A plain date key at noon UTC never shifts day across zones.
  const at = new Date(`${date}T12:00:00Z`);
  const format = ({ ...options }: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(at);
  return {
    month: format({ month: "short" }).replace(".", ""),
    year: format({ year: "numeric" }),
    day: format({ day: "numeric" }),
    weekday: format({ weekday: "short" }).replace(".", ""),
    full: format({ dateStyle: "full" }),
  };
}

/** A tear-off calendar page: month band, day number, weekday. Says "when" at a glance. */
export function DateLeaf({ date, locale = "en-GB", size, withYear, className }: DateLeafProps) {
  const p = parts({ date, locale });
  const key = size ?? "sm";
  return (
    <time dateTime={date} title={p.full} className={cn(dateLeafVariants({ size }), className)}>
      <span
        className={cn(
          "bg-foreground font-semibold tracking-wider text-background uppercase",
          BAND[key],
        )}
      >
        {p.month}
        {withYear ? ` ${p.year}` : ""}
      </span>
      <span
        className={cn("font-serif font-light text-black tabular-nums dark:text-white", NUMBER[key])}
      >
        {p.day}
      </span>
      <span className={cn("text-muted-foreground", WEEKDAY[key])}>{p.weekday}</span>
    </time>
  );
}
