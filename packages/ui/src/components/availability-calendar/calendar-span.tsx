import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { CalendarHoverCard } from "./calendar-hover-card";
import { bufferStyle, markStyle } from "./calendar-marks";
import { percentIn, toMinutes } from "./calendar-time";
import type { CalendarAudience, CalendarLine, CalendarWindow } from "./calendar-types";

type Segment = { kind: "setup" | "booking" | "teardown"; from: number; to: number };

/** Booking time, and for staff its setup before and teardown after (ADR 0059). */
export function segmentsOf({
  line,
  audience,
}: {
  line: CalendarLine;
  audience: CalendarAudience;
}): Segment[] {
  const from = toMinutes({ time: line.start });
  const to = toMinutes({ time: line.end });
  const booking: Segment = { kind: "booking", from, to };
  if (audience === "external") return [booking];
  return [
    { kind: "setup", from: from - line.setupMinutes, to: from },
    booking,
    { kind: "teardown", from: to, to: to + line.teardownMinutes },
  ].filter((segment): segment is Segment => segment.to > segment.from);
}

type Axis = "x" | "y";

function place({
  segment,
  window,
  axis,
}: {
  segment: Segment;
  window: CalendarWindow;
  axis: Axis;
}) {
  const { offset, size } = percentIn({ window, from: segment.from, to: segment.to });
  const style: CSSProperties =
    axis === "x"
      ? { left: `${offset}%`, width: `${size}%` }
      : { top: `${offset}%`, height: `${size}%` };
  return { style, size };
}

export type CalendarSpanProps = {
  line: CalendarLine;
  audience: CalendarAudience;
  window: CalendarWindow;
  axis: Axis;
  /** Cross-axis placement of the booking, e.g. `inset-y-1` on a horizontal track. */
  bookingClassName: string;
  /** Cross-axis placement of buffers: thinner than the booking so they read as attached. */
  bufferClassName: string;
  /** Receives the booking's size in percent of the track, to drop text that will not fit. */
  children: (size: number) => ReactNode;
  /** What the hover card shows instead of the line card. */
  card?: ReactNode;
  /** The line open beside the calendar: an ink ring. Nothing else is ever faded. */
  selected?: boolean;
  /** Opens the line's ticket. Mouse click or Enter; a touch tap shows the hover card first. */
  onSelect?: () => void;
};

function selectHandlers({ onSelect }: { onSelect?: () => void }) {
  if (!onSelect) return {};
  return {
    role: "button",
    onClick: (event: MouseEvent) => {
      const touch = "pointerType" in event.nativeEvent && event.nativeEvent.pointerType === "touch";
      if (!touch) onSelect();
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === "Enter") onSelect();
    },
  };
}

/** One line on a time track: the booking mark with its buffers attached. Hover shows details. */
export function CalendarSpan({ line, audience, window, axis, ...props }: CalendarSpanProps) {
  return (
    <>
      {segmentsOf({ line, audience }).map((segment) => {
        const { style, size } = place({ segment, window, axis });
        const booking = segment.kind === "booking";
        return (
          <CalendarHoverCard
            key={segment.kind}
            {...{ line, audience, card: props.card, disabled: props.selected }}
          >
            <div
              tabIndex={booking ? 0 : -1}
              className={cn(
                "absolute border outline-none focus-visible:ring-2 focus-visible:ring-ring",
                booking ? "z-10 overflow-hidden rounded-md text-xs" : props.bufferClassName,
                booking && props.bookingClassName,
                booking && props.onSelect && "cursor-pointer",
                booking &&
                  props.selected &&
                  "z-20 ring-2 ring-foreground ring-offset-2 ring-offset-card",
              )}
              style={{
                ...style,
                ...(booking
                  ? markStyle({ state: line.state, audience })
                  : bufferStyle({ state: line.state })),
              }}
              {...(booking ? selectHandlers({ onSelect: props.onSelect }) : {})}
            >
              {booking ? props.children(size) : null}
            </div>
          </CalendarHoverCard>
        );
      })}
    </>
  );
}
