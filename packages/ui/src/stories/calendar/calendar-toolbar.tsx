import { AvailabilityFilter, type AvailabilityFilterProps } from "./availability-filter";
import { CompactToolbar } from "./compact-toolbar";
import { RangeToolbar, type RangeToolbarProps } from "./range-toolbar";

export type CalendarToolbarProps = {
  range: RangeToolbarProps;
  filter: AvailabilityFilterProps;
};

/**
 * One row: the dates on the left, which assets on the right. Sized by the calendar, not the
 * screen: a narrow calendar gets the two-row `CompactToolbar`.
 */
export function CalendarToolbar(props: CalendarToolbarProps) {
  return (
    <>
      <div className="hidden min-w-0 items-center justify-between gap-3 @3xl:flex">
        <RangeToolbar {...props.range} />
        <AvailabilityFilter {...props.filter} />
      </div>
      <div className="@3xl:hidden">
        <CompactToolbar {...props} />
      </div>
    </>
  );
}
