import { z } from "zod";

/** Base entities an organization defines its own types for (ADR 0021). */
export const ENTITY_BASES = [
  "ITEM",
  "CUSTOMER",
  "CONTACT",
  "TICKET",
  "REQUIREMENT",
  "PROGRAM_ITEM",
] as const;
export type EntityBase = (typeof ENTITY_BASES)[number];

export const EntityBaseSchema = z
  .enum(ENTITY_BASES)
  .describe("Which kind of record the type classifies. Items are what is sold or booked.");

/** Generic item behaviours. Code knows these, never the names of types. */
export const ITEM_BEHAVIOURS = ["PRICED", "COMPOSABLE", "CHOICES", "BOOKABLE", "SETUPS"] as const;
export type ItemBehaviour = (typeof ITEM_BEHAVIOURS)[number];

export const ItemBehaviourSchema = z.enum(ITEM_BEHAVIOURS);

export const ItemBehavioursSchema = z
  .array(ItemBehaviourSchema)
  .max(ITEM_BEHAVIOURS.length)
  .refine((list) => new Set(list).size === list.length, "Behaviours must be unique")
  .describe(
    "Item types only. PRICED: price, unit and VAT. COMPOSABLE: contains other items. " +
      "CHOICES: choice groups among the parts (needs COMPOSABLE). BOOKABLE: occupies time, " +
      "with a default length. SETUPS: capacity per setup (needs BOOKABLE).",
  );

/** Behaviour → the behaviour it requires. */
export const BEHAVIOUR_REQUIRES: Partial<Record<ItemBehaviour, ItemBehaviour>> = {
  CHOICES: "COMPOSABLE",
  SETUPS: "BOOKABLE",
};
