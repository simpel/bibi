import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { CountedList } from "../counted-lists";

/**
 * What the requirement form reads (ADR 0021): requirement types and lists (own fields), the lists
 * a count can be against, every list value by "List: Value" (for the table) and the order's lines
 * a count can apply to.
 */
export type RequirementFormData = TypedFormData & {
  lists: CountedList[];
  values: NamedOption[];
  lines: NamedOption[];
  /** The caller may create types and lists: a missing one gets a link in the dialog. */
  canSetUp: boolean;
};
