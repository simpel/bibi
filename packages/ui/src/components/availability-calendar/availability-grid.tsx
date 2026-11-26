import { ChevronRightIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../collapsible/collapsible";
import { AvailabilityRow, type AvailabilityRowProps, LABEL_WIDTH } from "./availability-row";
import type { AssetBooking, CalendarAsset, CalendarTaskEntry } from "./calendar-types";
import { byDate } from "./day-occupancy";
import type { DayTotal } from "./day-value";
import { tasksByDate } from "./task-marks";
import { TasksLane } from "./tasks-lane";
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
  /** What each day is worth across the assets shown, in the day headings. */
  totals?: ReadonlyMap<string, DayTotal>;
  /** Shown instead of rows when the filter leaves none. */
  empty?: string;
  /** Tasks on any loaded day: a lane of their own on top, echoed on their assets' rows. */
  tasks?: readonly CalendarTaskEntry[];
  className?: string;
};

/** A group's name and size; a click folds its rows away and back. */
function GroupHeading({ group, count }: { group: string; count: number }) {
  return (
    <div className="sticky left-0 w-fit bg-card pt-4 pb-1.5 pl-[var(--gutter,0px)]">
      <CollapsibleTrigger className="group flex items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRightIcon className="size-3 transition-transform group-data-[state=open]:rotate-90" />
        {group} <span className="tabular-nums">· {count}</span>
      </CollapsibleTrigger>
    </div>
  );
}

type AssetGroupsProps = Omit<AvailabilityGridProps, "timeline" | "empty" | "totals" | "className">;

/** Each asset's tasks by day key; none without tasks, so rows draw as before. */
function assetTasksOf({ tasks, assetId }: { tasks: AssetGroupsProps["tasks"]; assetId: string }) {
  const own = tasks?.filter((task) => task.assetIds?.includes(assetId)) ?? [];
  return own.length ? tasksByDate({ tasks: own }) : undefined;
}

/** The organization's own groups of assets, a row each, in the order they first appear. */
function AssetGroups({ assets, bookings, frame, tasks, ...row }: AssetGroupsProps) {
  const groups = [...new Set(assets.map((asset) => asset.group))];
  return groups.map((group) => {
    const members = assets.filter((asset) => asset.group === group);
    return (
      <Collapsible key={group} defaultOpen asChild>
        <section aria-label={group}>
          <GroupHeading group={group} count={members.length} />
          <CollapsibleContent>
            {members.map((asset) => (
              <AvailabilityRow
                key={asset.id}
                asset={asset}
                days={byDate({
                  bookings: bookings.filter((booking) => booking.assetId === asset.id),
                })}
                frame={frame}
                tasks={assetTasksOf({ tasks, assetId: asset.id })}
                {...row}
              />
            ))}
          </CollapsibleContent>
        </section>
      </Collapsible>
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
  totals,
  tasks,
  className,
  ...row
}: AvailabilityGridProps) {
  return (
    <div
      data-slot="calendar-grid"
      ref={timeline.scrollerRef}
      onScroll={timeline.onScroll}
      className={cn("touch-pan-x touch-pan-y overflow-auto overscroll-contain", className)}
    >
      <div className={cn(LABEL_WIDTH, "w-max min-w-full pb-1")}>
        <TimelineHeader frame={frame} labelRef={timeline.labelRef} totals={totals} />
        {empty ? (
          <p className="sticky left-0 w-[min(36rem,calc(100vw-4rem))] px-4 py-10 text-center text-sm text-muted-foreground">
            {empty}
          </p>
        ) : null}
        {tasks ? <TasksLane tasks={tasks} frame={frame} /> : null}
        <AssetGroups {...{ assets, bookings, frame, tasks }} {...row} />
      </div>
    </div>
  );
}
