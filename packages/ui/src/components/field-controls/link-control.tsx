import { Combobox } from "../combobox/combobox";
import type { ChoiceControlProps } from "./control-props";

export type LinkControlProps = ChoiceControlProps<string> & {
  /** Shown while nothing is linked (localised by the caller). */
  placeholder: string;
  /** Placeholder of the search box (localised by the caller). */
  searchPlaceholder: string;
  /** Shown when no record matches the search (localised by the caller). */
  emptyText: string;
};

/** LINK field: one record of the target type, picked with a searchable combobox. */
export function LinkControl(props: LinkControlProps) {
  const { value, onChange, choices, placeholder, searchPlaceholder, emptyText, ...rest } = props;
  return (
    <Combobox
      {...rest}
      options={choices}
      value={value === "" ? undefined : value}
      onValueChange={onChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
    />
  );
}
