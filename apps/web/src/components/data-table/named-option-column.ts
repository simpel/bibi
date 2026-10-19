import type { ColumnDef } from "@okazi/ui";
import { type NamedOption, nameOf } from "@/components/form/named-option";

export type NamedOptionColumnInput<TData> = {
  id: string;
  header: string;
  options: readonly NamedOption[];
  /** The row's reference to an option (`null` when unset). */
  pick: (row: TData) => string | null;
  /** Cell text when the caller may not view the options (ADR 0050). */
  hidden?: string | undefined;
};

/** A column showing a referenced option's name; it sorts by that displayed name. */
export function namedOptionColumn<TData>({
  id,
  header,
  options,
  pick,
  hidden,
}: NamedOptionColumnInput<TData>): ColumnDef<TData> {
  return { id, header, accessorFn: (row) => nameOf({ options, id: pick(row), hidden }) };
}
