import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/**
 * What the requirement form reads (ADR 0021): requirement types and lists (own fields), the list
 * values to count ("List: Value") and the ticket's program items a count can apply to.
 */
export type RequirementFormData = TypedFormData & {
  values: NamedOption[];
  programItems: NamedOption[];
};
