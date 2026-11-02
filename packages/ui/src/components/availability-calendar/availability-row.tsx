import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { ContactName } from "../person-contact/contact-name";
import { addDays, weekdayOf } from "./calendar-dates";
import { PersonAvatar } from "./calendar-people";
import type { AssetBooking, CalendarAsset } from "./calendar-types";
import { lanesOf } from "./clashes";
import { DayCell } from "./day-cell";
import { DayTrack, type DayTrackProps, LANE_REM } from "./day-track";
import type { TimelineFrame } from "./timeline-scale";

/**
 * The label column's width, set once on the grid so sticky parts can line up with it. A quarter
 * of the calendar's width, kept between a short name and a long one, so the days keep the room.
 */
export const LABEL_WIDTH = "[--label:clamp(6rem,24cqw,14rem)]";

/** Label column, then the track: shared by the header and every row. */
export const ROW_GRID = "grid grid-cols-[var(--label)_1fr]";

export type AvailabilityRowProps = Pick<DayTrackProps, "selectedId" | "onAdd" | "onOpen"> & {
  asset: CalendarAsset;
  /** This asset's bookings by day key, every loaded day. */
  days: ReadonlyMap<string, readonly AssetBooking[]>;
  frame: TimelineFrame;
};

const NAME = "line-clamp-2 text-sm leading-tight break-words @2xl:truncate";

/** A person's name opens their contact card on hover; any asset's name links to its page. */
function AssetName({ asset }: { asset: CalendarAsset }) {
  const { person, href, name } = asset;
  if (person) {
    const contact = { ...person, description: person.role };
    return <ContactName contact={contact} href={href} className={NAME} />;
  }
  if (!href) return <span className={NAME}>{name}</span>;
  return (
    <AppLink href={href} className={cn(NAME, "underline-offset-2 hover:underline")}>
      {name}
    </AppLink>
  );
}

/**
 * Pinned while the days scroll: avatar for people, the name, and one fact to pick by. A narrow
 * calendar wraps the name to two lines and drops the avatar and the fact; the full name is a tooltip.
 * The name links to the asset's page when it has one.
 */
export function AssetLabel({ asset }: { asset: CalendarAsset }) {
  return (
    <div
      title={asset.person ? undefined : asset.name}
      className="sticky left-0 z-30 flex min-w-0 items-center gap-2 border-r bg-card py-1.5 pr-2 pl-[var(--gutter,0px)] @2xl:pr-3"
    >
      {asset.person ? (
        <span className="hidden shrink-0 @2xl:contents">
          <PersonAvatar person={asset.person} size="sm" />
        </span>
      ) : null}
      <div className="grid min-w-0">
        <AssetName asset={asset} />
        {asset.detail ? (
          <span className="hidden truncate text-xs text-muted-foreground @2xl:block">
            {asset.detail}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/** As tall as the busiest loaded day needs, so rows keep their height while you scroll. */
function rowRem({ days, frame }: Pick<AvailabilityRowProps, "days" | "frame">) {
  if (frame.detail === "cells") return 2.5;
  const lanes = [...days.values()].map((bookings) => lanesOf({ lines: bookings }).count);
  return Math.max(1, ...lanes) * LANE_REM + 0.75;
}

/** Weekends sit on a faint ground in every zoom: the week's shape at a glance. */
function DayColumn({
  index,
  frame,
  children,
}: {
  index: number;
  frame: TimelineFrame;
  children: ReactNode;
}) {
  const weekend = weekdayOf({ date: addDays({ date: frame.start, days: index }) }) >= 5;
  return (
    <div
      className="absolute inset-y-0 bg-card"
      style={{ left: index * frame.pitch, width: frame.dayPx }}
    >
      {weekend ? <span className="absolute inset-0 bg-muted/60" /> : null}
      {children}
    </div>
  );
}

/** One asset across the loaded days; only the days on screen are drawn. Nights are seams. */
export function AvailabilityRow({ asset, days, frame, ...props }: AvailabilityRowProps) {
  return (
    <div className={cn(ROW_GRID, "border-t")}>
      <AssetLabel asset={asset} />
      <div
        className="relative bg-muted"
        style={{ height: `${rowRem({ days, frame })}rem`, width: frame.width }}
      >
        {frame.drawn.map((index) => {
          const date = addDays({ date: frame.start, days: index });
          const bookings = days.get(date) ?? [];
          return (
            <DayColumn key={date} index={index} frame={frame}>
              {frame.detail === "cells" ? (
                <DayCell
                  assetName={asset.name}
                  date={date}
                  bookings={bookings}
                  hours={frame.hours}
                  formatDate={frame.formatDate}
                  onDrill={frame.onDrill}
                />
              ) : (
                <DayTrack
                  asset={asset}
                  date={date}
                  bookings={bookings}
                  window={frame.hours}
                  lane={lanesOf({ lines: bookings }).lane}
                  withHours={frame.detail === "hours"}
                  {...props}
                />
              )}
            </DayColumn>
          );
        })}
      </div>
    </div>
  );
}
