import { AddSlot } from "./add-slot";
import { BookingDetails } from "./booking-details";
import { CalendarSpan } from "./calendar-span";
import { formatMinutes, percentIn } from "./calendar-time";
import type { AssetBooking, CalendarAsset, CalendarWindow } from "./calendar-types";
import { clashesOf } from "./clashes";
import { HourRules } from "./time-axis";

/** One sub-lane is 2.25rem; a row with a clash grows a lane per overlapping booking. */
export const LANE_REM = 2.25;

export type DayTrackProps = {
  asset: CalendarAsset;
  date: string;
  /** This asset's bookings on this day only. */
  bookings: readonly AssetBooking[];
  window: CalendarWindow;
  lane: Map<string, number>;
  /** Hour rules and point-to-add, once hours are wide enough to aim at. */
  withHours: boolean;
  selectedId?: string;
  onAdd?: (input: { asset: CalendarAsset; date: string; start: string; end: string }) => void;
  onOpen?: (booking: AssetBooking) => void;
};

/** Who it is for, then the time once the block is wide enough (measured, not guessed). */
function BlockLabel({ booking }: { booking: AssetBooking }) {
  return (
    <span className="@container block size-full">
      <span className="flex h-full items-center gap-1.5 px-2 whitespace-nowrap @max-[4rem]:px-1 @max-[2.5rem]:invisible">
        <span className="truncate font-medium">{booking.customer ?? booking.name}</span>
        <span className="hidden tabular-nums opacity-80 @min-[11rem]:inline">
          {booking.start}–{booking.end}
        </span>
      </span>
    </span>
  );
}

/**
 * The stretch two lines on this asset share: a red ground behind the bookings, notched on top.
 * It lets the pointer through. Red means clash and only that.
 */
function Clashes({ bookings, window }: Pick<DayTrackProps, "bookings" | "window">) {
  return clashesOf({ lines: bookings }).map((clash) => {
    const { offset, size } = percentIn({ window, from: clash.from, to: clash.to });
    const label = `Clash ${formatMinutes({ minutes: clash.from })}–${formatMinutes({ minutes: clash.to })}`;
    return (
      <span
        key={clash.from}
        role="img"
        aria-label={label}
        title={label}
        className="pointer-events-none absolute inset-y-0 z-[5] overflow-hidden rounded-md bg-destructive/20"
        style={{ left: `${offset}%`, width: `${size}%` }}
      >
        <span className="absolute inset-x-0 top-0 h-1 bg-destructive" />
      </span>
    );
  });
}

type BookingsProps = Pick<
  DayTrackProps,
  "bookings" | "window" | "lane" | "selectedId" | "onOpen" | "withHours"
>;

/**
 * Each booking in its sub-lane; the lane box lets the pointer through to the empty track. Zoomed
 * out to thin blocks, buffers are dropped: they would take the name's room.
 */
function Bookings({ bookings, window, lane, selectedId, onOpen, withHours }: BookingsProps) {
  return bookings.map((booking) => (
    <div
      key={booking.id}
      className="pointer-events-none absolute inset-x-0 *:pointer-events-auto"
      style={{ top: `${(lane.get(booking.id) ?? 0) * LANE_REM + 0.375}rem`, height: "2rem" }}
    >
      <CalendarSpan
        line={withHours ? booking : { ...booking, setupMinutes: 0, teardownMinutes: 0 }}
        audience="internal"
        window={window}
        axis="x"
        bookingClassName="inset-y-0"
        bufferClassName="inset-y-2"
        selected={booking.id === selectedId}
        card={
          <BookingDetails booking={booking} onOpen={onOpen ? () => onOpen(booking) : undefined} />
        }
        onSelect={onOpen ? () => onOpen(booking) : undefined}
      >
        {() => <BlockLabel booking={booking} />}
      </CalendarSpan>
    </div>
  ));
}

/** One asset's day: its bookings across the open hours, clashes behind them. */
export function DayTrack({ asset, date, withHours, onAdd, ...props }: DayTrackProps) {
  return (
    <>
      {withHours ? <HourRules window={props.window} /> : null}
      {withHours && onAdd ? (
        <AddSlot
          assetName={asset.name}
          lines={props.bookings}
          window={props.window}
          onAdd={(slot) => onAdd({ asset, date, ...slot })}
        />
      ) : null}
      <Bookings withHours={withHours} {...props} />
      <Clashes bookings={props.bookings} window={props.window} />
    </>
  );
}
