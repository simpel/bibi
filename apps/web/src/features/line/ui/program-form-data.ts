import type { ItemDto, PriceEffect } from "@bibi/core/schemas";
import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import type { LineStateOption } from "./line-state-option";

/** One layout of a room: its name and capacity (null = unknown). */
export type LayoutOption = NamedOption & { capacity: number | null };

/** An item a line can hold: its venue's zone, list price and type (the picker's group). */
export type ItemOption = NamedOption & {
  timeZone: string;
  priceMinor: number | null;
  priceUnit: ItemDto["priceUnit"];
  entityTypeId: string;
  typeName?: string;
};

/** A bookable item (a room, equipment) with its layouts. */
export type BookableOption = ItemOption & { layouts: LayoutOption[] };

/** A `BUNDLE` item with its venue's zone (ADR 0064). */
export type BundleOption = NamedOption & { timeZone: string };

/** An item with customisation groups (ADR 0059), the options a line of it can choose from. */
export type CustomisableItem = {
  itemId: string;
  groups: {
    /** The group's id, as a line's `UNCHOSEN_REQUIRED_GROUP` warning names it. */
    id: string;
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
 * fields), the bookable items and their layouts to pick from, and the item states of the lines.
 */
export type ProgramFormData = TypedFormData & {
  items: BookableOption[];
  /** The items that are not booked (a dish, a drink): a line can hold them, they have no place. */
  otherItems: ItemOption[];
  /** The caller may not view items: their names show as hidden and the picker is disabled. */
  itemsHidden: boolean;
  /** `BUNDLE` items that can be added as a bundle line with its parts (ADR 0059). */
  bundles: BundleOption[];
  /** The organization's zone: the zone of a line without an item (ADR 0064). */
  timeZone: string;
  /** Items with customisation groups, so a line of one can choose its options. */
  customisable: CustomisableItem[];
  /** Every item state, so a line shows its state and the states it may move to. */
  states: LineStateOption[];
};
