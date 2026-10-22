import type { PriceEffect } from "@bibi/core/schemas";
import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { LineStateOption } from "./line-state-option";

/** A bookable item a line can be held in, with the ids of its setups. */
export type BookableOption = NamedOption & { setupIds: string[] };

/** An item with customisation groups (ADR 0059), the options a line of it can choose from. */
export type CustomisableItem = {
  itemId: string;
  groups: {
    name: string;
    minPick: number;
    maxPick: number;
    options: { itemId: string; name: string; priceEffect: PriceEffect }[];
  }[];
};

/**
 * What the run schedule reads besides the lines: line types and lists (own
 * fields), the bookable items and setups to pick from, and the item states of the lines.
 */
export type ProgramFormData = TypedFormData & {
  items: BookableOption[];
  /** The caller may not view items: their names show as hidden and the picker is disabled. */
  itemsHidden: boolean;
  setups: NamedOption[];
  /** `BUNDLE` items that can be added as a bundle line with its parts (ADR 0059). */
  bundles: NamedOption[];
  /** Items with customisation groups, so a line of one can choose its options. */
  customisable: CustomisableItem[];
  /** Every item state, so a line shows its state and the states it may move to. */
  states: LineStateOption[];
};
