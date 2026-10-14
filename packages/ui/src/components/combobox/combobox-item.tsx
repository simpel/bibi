import { CheckIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { CommandItem } from "../command/command";
import type { ComboboxOption } from "./combobox-groups";

export type ComboboxItemProps = {
  option: ComboboxOption;
  selected: boolean;
  onSelect: (value: string) => void;
};

export function ComboboxItem(props: ComboboxItemProps) {
  const { option, selected, onSelect } = props;
  return (
    <CommandItem
      value={option.value}
      keywords={[option.label, option.description ?? ""]}
      onSelect={() => onSelect(option.value)}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{option.label}</span>
        {option.description && (
          <span className="truncate text-xs text-muted-foreground">{option.description}</span>
        )}
      </div>
      <CheckIcon className={cn("ml-auto", selected ? "opacity-100" : "opacity-0")} />
    </CommandItem>
  );
}
