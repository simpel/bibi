import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { type BookingTone, bookingToneVariants } from "../booking-tone/booking-tone";
import { type KeyFact, KeyFacts } from "../key-facts/key-facts";
import { OrderView, type OrderViewProps } from "../order-view/order-view";

export type OrderDayCardProps = Pick<OrderViewProps, "reference" | "subtitle" | "status"> & {
  /** The order's name; the title links to `href`. */
  title: string;
  href: string;
  /** Guests, when and where, in the pinned card's stat row. */
  facts: readonly KeyFact[];
  tone: BookingTone;
  /** "Live" while the card's span holds now. */
  live?: string | undefined;
  /** The most urgent thing to look at, e.g. a link chip. */
  flag?: ReactNode;
  /** How many more flags there are, e.g. "+2". */
  more?: string | undefined;
  className?: string;
};

function Footer({ live, flag, more }: Pick<OrderDayCardProps, "live" | "flag" | "more">) {
  if (!live && !flag) return null;
  return (
    <div className="relative z-10 flex flex-wrap items-center gap-2">
      {live ? (
        <span className="inline-flex items-center gap-1.5 font-semibold text-[10px] text-success uppercase tracking-wide">
          <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-success" />
          {live}
        </span>
      ) : null}
      {flag}
      {more ? <span className="text-muted-foreground">{more}</span> : null}
    </div>
  );
}

/**
 * One order on one day of a timeline, in the pinned calendar card's layout (`OrderView` bare):
 * name and reference, the subtitle, the status badge top right, the stat row and, only when
 * there is one, the flag. The whole card opens the order (the title link stretches over it, so
 * hovering the card underlines the title); the flag stays its own link above it. The outline
 * carries the card's tone (`bookingToneVariants`).
 */
export function OrderDayCard({
  title,
  href,
  facts,
  tone,
  live,
  flag,
  more,
  ...props
}: OrderDayCardProps) {
  return (
    <div
      data-slot="order-day-card"
      data-tone={tone}
      className={cn(
        "group relative cursor-pointer rounded-xl border bg-card p-3.5 text-card-foreground shadow-sm transition-colors hover:border-foreground/30",
        bookingToneVariants({ tone }),
        props.className,
      )}
    >
      <OrderView
        bare
        title={
          <AppLink
            href={href}
            className="underline-offset-2 outline-none after:absolute after:inset-0 after:rounded-xl group-hover:underline focus-visible:underline"
          >
            {title}
          </AppLink>
        }
        reference={props.reference}
        subtitle={props.subtitle}
        status={props.status}
        highlight={<KeyFacts size="sm" facts={facts} className="border-y border-border/60 py-2" />}
        footer={live || flag ? <Footer live={live} flag={flag} more={more} /> : undefined}
      />
    </div>
  );
}
