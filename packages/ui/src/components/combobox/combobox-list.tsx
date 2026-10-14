import { useMemo } from "react";
import { CommandEmpty, CommandGroup, CommandList } from "../command/command";
import { type ComboboxOption, groupOptions } from "./combobox-groups";
import { ComboboxItem } from "./combobox-item";

export type ComboboxListProps = {
  options: ComboboxOption[];
  value?: string;
  emptyText: string;
  onSelect: (value: string) => void;
};

export function ComboboxList(props: ComboboxListProps) {
  const { options, value, emptyText, onSelect } = props;
  const groups = useMemo(() => groupOptions({ options }), [options]);
  return (
    <CommandList>
      <CommandEmpty>{emptyText}</CommandEmpty>
      {groups.map((group) => (
        <CommandGroup key={group.heading ?? ""} heading={group.heading}>
          {group.options.map((option) => (
            <ComboboxItem
              key={option.value}
              option={option}
              selected={option.value === value}
              onSelect={onSelect}
            />
          ))}
        </CommandGroup>
      ))}
    </CommandList>
  );
}
