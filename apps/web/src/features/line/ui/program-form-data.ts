import type { ItemDto, PriceEffect } from "@bibi/core/schemas";
import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { LineStateOption } from "./line-state-option";

/** A bookable item with its setups, its venue's zone and its list price (shown in the picker). */
export type BookableOption = NamedOption & {
  setupIds: string[];
  timeZone: string;
  priceMinor: number | null;
  priceUnit: ItemDto["priceUnit"];
};

/** A `BUNDLE` item with its venue's zone (ADR 0064). */
export type BundleOption = NamedOption & { timeZone: string };

/** An item with customisation groups (ADR 0059), the options a line of it can choose from. */
export type CustomisableItem = {
  itemId: string;
  groups: {
    name: string;
    minPick: number;
    maxPick: number;
    /** Split between guests (ADR 0082): each chosen option gets its own quantity. */
    split: boolean;
    /** Picks beyond maxPick may be added as add-ons at the item's own price (ADR 0088). */
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
  bundles: BundleOption[];
  /** The organization's zone: the zone of a line without an item (ADR 0064). */
  timeZone: string;
  /** Items with customisation groups, so a line of one can choose its options. */
  customisable: CustomisableItem[];
  /** Every item state, so a line shows its state and the states it may move to. */
  states: LineStateOption[];
};
