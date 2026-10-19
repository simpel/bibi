import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { LineStateOption } from "./line-state-option";

/** A bookable item a line can be held in, with the ids of its setups. */
export type BookableOption = NamedOption & { setupIds: string[] };

/**
 * What the run schedule reads besides the lines: line types and lists (own
 * fields), the bookable items and setups to pick from, and the item states of the lines.
 */
export type ProgramFormData = TypedFormData & {
  items: BookableOption[];
  setups: NamedOption[];
  /** Every item state, so a line shows its state and the states it may move to. */
  states: LineStateOption[];
};
