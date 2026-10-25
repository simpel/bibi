"use client";

import { ChevronDownIcon, ListFilterIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../button/button";
import { Checkbox } from "../checkbox/checkbox";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../command/command";
import { Popover, PopoverContent, PopoverTrigger } from "../popover/popover";
import { type CalendarLabels, useCalendarLabels } from "./calendar-labels";

/** Above this many groups the list gets a search field. */
const SEARCH_FROM = 9;

export type GroupPickerProps = {
  /** Every group with how many assets it has, in the org's order. */
  groups: readonly { name: string; count: number }[];
  /** The picked groups; none picked shows every asset. */
  picked: readonly string[];
  onPicked: (picked: string[]) => void;
  /** An icon button with the number picked, for a narrow calendar. */
  compact?: boolean;
};

type LabelOfInput = Pick<GroupPickerProps, "groups" | "picked"> & { labels: CalendarLabels };

function labelOf({ groups, picked, labels }: LabelOfInput) {
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  if (picked.length === 0) return { text: labels.allAssets, count: total };
  const count = groups
    .filter((group) => picked.includes(group.name))
    .reduce((sum, group) => sum + group.count, 0);
  return {
    text: picked.length === 1 ? picked[0] : labels.groupCount({ count: picked.length }),
    count,
  };
}

function Row({
  name,
  count,
  checked,
  onSelect,
}: {
  name: string;
  count: number;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={name} onSelect={onSelect}>
      <Checkbox checked={checked} tabIndex={-1} aria-hidden className="pointer-events-none" />
      <span className="truncate">{name}</span>
      <span className="ml-auto text-muted-foreground tabular-nums">{count}</span>
    </CommandItem>
  );
}

/** The groups as checkable rows, with a search field when there are many. */
function GroupList({ groups, picked, onPicked }: GroupPickerProps) {
  const toggle = ({ name }: { name: string }) =>
    onPicked(picked.includes(name) ? picked.filter((p) => p !== name) : [...picked, name]);
  const labels = useCalendarLabels();
  return (
    <Command>
      {groups.length >= SEARCH_FROM ? <CommandInput placeholder={labels.searchGroups} /> : null}
      <CommandList>
        <CommandEmpty>{labels.noGroupMatch}</CommandEmpty>
        <Row
          name={labels.allAssets}
          count={labelOf({ groups, picked: [], labels }).count}
          checked={picked.length === 0}
          onSelect={() => onPicked([])}
        />
        <CommandSeparator />
        {groups.map((group) => (
          <Row
            key={group.name}
            {...group}
            checked={picked.includes(group.name)}
            onSelect={() => toggle({ name: group.name })}
          />
        ))}
      </CommandList>
    </Command>
  );
}

/** Inside the button: what is shown and how many, or an icon with the number of groups picked. */
function TriggerContent(props: GroupPickerProps) {
  const label = labelOf({ ...props, labels: useCalendarLabels() });
  if (props.compact) {
    return (
      <>
        <ListFilterIcon aria-hidden />
        {props.picked.length > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 grid size-4 place-items-center rounded-full bg-primary text-[0.625rem] text-primary-foreground tabular-nums">
            {props.picked.length}
          </span>
        ) : null}
      </>
    );
  }
  return (
    <>
      <span className="truncate">{label.text}</span>
      <span className="ml-auto text-muted-foreground tabular-nums">{label.count}</span>
      <ChevronDownIcon aria-hidden className="opacity-50" />
    </>
  );
}

/** Pick any number of asset groups. Groups are the org's own, so there may be many. */
export function GroupPicker(props: GroupPickerProps) {
  const [open, setOpen] = useState(false);
  const labels = useCalendarLabels();
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={props.compact ? "icon" : "default"}
          role="combobox"
          aria-expanded={open}
          aria-label={labels.assetGroups}
          className={props.compact ? "relative shrink-0" : "justify-between font-normal w-44"}
        >
          <TriggerContent {...props} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={props.compact ? "end" : "start"} className="w-56 p-0">
        <GroupList {...props} />
      </PopoverContent>
    </Popover>
  );
}
