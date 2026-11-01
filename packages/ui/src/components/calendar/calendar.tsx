"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { type ComponentProps, useEffect, useRef } from "react";
import { type DayButton, DayPicker } from "react-day-picker";
import { enGB, sv } from "react-day-picker/locale";
import { cn } from "../../lib/cn";
import { Button } from "../button/button";
import { calendarClassNames } from "./calendar-class-names";

export type { DateRange } from "react-day-picker";

/** The calendar locales, keyed by the app's locale codes. */
export const calendarLocales = { sv, en: enGB } as const;

export type CalendarProps = ComponentProps<typeof DayPicker>;

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: ComponentProps<typeof DayButton>) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  const edge = modifiers.range_start || modifiers.range_end;
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-end=true]:rounded-md data-[range-start=true]:rounded-md data-[range-end=true]:bg-primary data-[range-start=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-start=true]:text-primary-foreground data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground",
        edge && "z-10",
        className,
      )}
      {...props}
    />
  );
}

/** A month grid for picking a day or a range (`mode="range"`); shadcn's Calendar on react-day-picker. */
export function Calendar({ className, classNames, components, ...props }: CalendarProps) {
  return (
    <DayPicker
      data-slot="calendar"
      showOutsideDays
      className={cn("bg-background p-2 [--cell-size:--spacing(8)]", className)}
      classNames={{ ...calendarClassNames(), ...classNames }}
      components={{
        Chevron: ({ orientation, className: iconClass }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", iconClass)} />
          ) : (
            <ChevronRightIcon className={cn("size-4", iconClass)} />
          ),
        DayButton: CalendarDayButton,
        ...components,
      }}
      {...props}
    />
  );
}
