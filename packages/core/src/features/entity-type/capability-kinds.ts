import { z } from "zod";

/** Base entities an organization defines its own types for (ADR 0021). */
export const ENTITY_BASES = [
  "ITEM",
  "CUSTOMER",
  "CONTACT",
  "TICKET",
  "REQUIREMENT",
  "LINE",
] as const;
export type EntityBase = (typeof ENTITY_BASES)[number];

export const EntityBaseSchema = z
  .enum(ENTITY_BASES)
  .describe("Which kind of record the type classifies. Items are what is sold or booked.");

/** Generic item capabilities. Code knows these, never the names of types. */
export const ITEM_CAPABILITIES = [
  "PRICED",
  "BUNDLE",
  "CUSTOMISATIONS",
  "BOOKABLE",
  "SETUPS",
] as const;
export type ItemCapability = (typeof ITEM_CAPABILITIES)[number];

export const ItemCapabilitySchema = z.enum(ITEM_CAPABILITIES);

export const ItemCapabilitiesSchema = z
  .array(ItemCapabilitySchema)
  .max(ITEM_CAPABILITIES.length)
  .refine((list) => new Set(list).size === list.length, "Capabilities must be unique")
  .describe(
    "Item types only. PRICED: price, unit and VAT. BUNDLE: contains other items. " +
      "CUSTOMISATIONS: groups of options, each an item with a price effect. BOOKABLE: occupies time, " +
      "with a default length. SETUPS: capacity per setup (needs BOOKABLE).",
  );

/** Capability → the capability it requires. */
export const CAPABILITY_REQUIRES: Partial<Record<ItemCapability, ItemCapability>> = {
  SETUPS: "BOOKABLE",
};
