"use client";

import { groupsOf } from "./availability-filter";
import type { CalendarToolbarProps } from "./calendar-toolbar";
import { GroupPicker } from "./group-picker";
import { LevelSelect } from "./level-select";
import { RangeStepper } from "./range-toolbar";
import { SearchToggle } from "./search-toggle";

/** The days on screen, with the group and search buttons. */
function TopRow({ range, filter }: CalendarToolbarProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p aria-live="polite" className="min-w-0 flex-1 truncate text-sm font-medium tabular-nums">
        {range.label}
      </p>
      <GroupPicker
        compact
        groups={groupsOf({ assets: filter.assets })}
        picked={filter.groups}
        onPicked={filter.onGroups}
      />
      <SearchToggle {...filter} />
    </div>
  );
}

/**
 * The toolbar for a narrow calendar: what is on screen with filter and search buttons, then the
 * range dropdown and the stepper. Two rows on a phone, one row once they fit.
 */
export function CompactToolbar(props: CalendarToolbarProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 @xl:flex-row-reverse @xl:items-center @xl:gap-3">
      <div className="min-w-0 flex-1">
        <TopRow {...props} />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 @xl:shrink-0">
        <LevelSelect {...props.range} />
        <RangeStepper onStep={props.range.onStep} onToday={props.range.onToday} />
      </div>
    </div>
  );
}
