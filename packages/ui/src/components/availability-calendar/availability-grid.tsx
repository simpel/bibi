import { cn } from "../../lib/cn";
import { AvailabilityRow, type AvailabilityRowProps, LABEL_WIDTH } from "./availability-row";
import type { AssetBooking, CalendarAsset } from "./calendar-types";
import { byDate } from "./day-occupancy";
import { TimelineHeader } from "./timeline-header";
import type { TimelineFrame } from "./timeline-scale";
import type { Timeline } from "./use-timeline";

export type AvailabilityGridProps = Pick<
  AvailabilityRowProps,
  "selectedId" | "onAdd" | "onOpen"
> & {
  assets: readonly CalendarAsset[];
  bookings: readonly AssetBooking[];
  timeline: Pick<Timeline, "scrollerRef" | "labelRef" | "onScroll">;
  frame: TimelineFrame;
  /** Shown instead of rows when the filter leaves none. */
  empty?: string;
  className?: string;
};

function GroupHeading({ group, count }: { group: string; count: number }) {
  return (
    <div className="sticky left-0 w-fit bg-card pt-4 pb-1.5 pl-[var(--gutter,0px)] text-xs font-medium text-muted-foreground">
      {group} <span className="tabular-nums">· {count}</span>
    </div>
  );
}

type AssetGroupsProps = Omit<AvailabilityGridProps, "timeline" | "empty" | "className">;

/** The organization's own groups of assets, a row each, in the order they first appear. */
function AssetGroups({ assets, bookings, frame, ...row }: AssetGroupsProps) {
  const groups = [...new Set(assets.map((asset) => asset.group))];
  return groups.map((group) => {
    const members = assets.filter((asset) => asset.group === group);
    return (
      <section key={group} aria-label={group}>
        <GroupHeading group={group} count={members.length} />
        {members.map((asset) => (
          <AvailabilityRow
            key={asset.id}
            asset={asset}
            days={byDate({ bookings: bookings.filter((booking) => booking.assetId === asset.id) })}
            frame={frame}
            {...row}
          />
        ))}
      </section>
    );
  });
}

/**
 * Availability: assets down, days across, every booking at once. Days stay on top and names on
 * the left while it scrolls both ways; only the days on screen are drawn, however many load.
 */
export function AvailabilityGrid({
  assets,
  bookings,
  timeline,
  frame,
  empty,
  className,
  ...row
}: AvailabilityGridProps) {
  return (
    <div
      ref={timeline.scrollerRef}
      onScroll={timeline.onScroll}
      className={cn("touch-pan-x touch-pan-y overflow-auto overscroll-contain", className)}
    >
      <div className={cn(LABEL_WIDTH, "w-max min-w-full pb-1")}>
        <TimelineHeader frame={frame} labelRef={timeline.labelRef} />
        {empty ? (
          <p className="sticky left-0 w-[min(36rem,calc(100vw-4rem))] px-4 py-10 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        ) : null}
        <AssetGroups assets={assets} bookings={bookings} frame={frame} {...row} />
      </div>
    </div>
  );
}
