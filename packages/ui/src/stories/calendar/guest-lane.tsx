import { cn } from "../../lib/cn";
import { percentIn } from "./calendar-time";
import type { CalendarWindow } from "./calendar-types";
import { GUEST_RULE, GuestMark } from "./guest-mark";
import type { GuestStop } from "./guest-path";
import { HourRules } from "./time-axis";

export type GuestLaneProps = {
  stops: readonly GuestStop[];
  headcount: number;
  window: CalendarWindow;
};

/** The first lane: where the guests are through the day, one ink rule per place, named above it. */
export function GuestLane({ stops, headcount, window }: GuestLaneProps) {
  if (stops.length === 0) return null;
  return (
    <div className="grid grid-cols-1 border-t @2xl:grid-cols-[12rem_1fr]">
      <div className="flex items-center gap-2 pt-2 pr-4 @2xl:py-2.5">
        <p className="text-sm font-medium">Guests</p>
        <GuestMark count={headcount} />
      </div>
      <div className="relative h-11 @2xl:h-auto @2xl:min-h-12">
        <HourRules window={window} />
        {stops.map((stop) => {
          const { offset, size } = percentIn({ window, from: stop.from, to: stop.to });
          return (
            <div
              key={`${stop.place}-${stop.from}`}
              className="absolute inset-y-0 flex flex-col justify-center gap-1 px-px"
              style={{ left: `${offset}%`, width: `${size}%` }}
            >
              <span className="truncate px-1 text-xs font-medium">{stop.place}</span>
              <span className={cn(GUEST_RULE, "h-1")} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The same path standing up, for the day column: an ink rail beside the column it is in. */
export function GuestRail({
  stops,
  window,
  className,
}: Pick<GuestLaneProps, "stops" | "window"> & { className?: string }) {
  return stops.map((stop) => {
    const { offset, size } = percentIn({ window, from: stop.from, to: stop.to });
    return (
      <span
        key={`${stop.place}-${stop.from}`}
        title={`Guests: ${stop.place}`}
        className={cn(GUEST_RULE, "absolute w-1", className)}
        style={{ top: `${offset}%`, height: `${size}%` }}
      />
    );
  });
}
