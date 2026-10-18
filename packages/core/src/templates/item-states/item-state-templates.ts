import type { ItemStateFlags } from "../../features/item-state/schema";

/**
 * One state of a template (ADR 0044): name, color and flags. `holdIfBookable` is the hold the
 * state gets on a `BOOKABLE` type; other types never hold (`NONE`). `expiry` marks the state
 * lines in an expiring state fall to.
 */
export type ItemStateTemplateState = {
  name: string;
  color: string;
  holdIfBookable?: Exclude<ItemStateFlags["hold"], "NONE">;
  flags?: Partial<Omit<ItemStateFlags, "hold">>;
  expiry?: true;
};

const released: ItemStateTemplateState = {
  name: "Released",
  color: "#94a3b8",
  flags: { released: true },
  expiry: true,
};

/**
 * The state templates of the guided setup (ADR 0044), initial state first. Template data in the
 * organization's language is edited freely after it is applied.
 */
export const ITEM_STATE_TEMPLATES = {
  bookable: [
    { name: "Prebooked", color: "#f59e0b", holdIfBookable: "SOFT", flags: { expires: true } },
    { name: "Booked", color: "#16a34a", holdIfBookable: "HARD", flags: { inSheets: true } },
    released,
  ],
  food: [
    { name: "Estimated", color: "#f59e0b" },
    { name: "Ordered", color: "#2563eb" },
    { name: "Locked", color: "#16a34a", flags: { inSheets: true } },
    released,
  ],
  other: [
    { name: "Planned", color: "#f59e0b", holdIfBookable: "SOFT" },
    { name: "Confirmed", color: "#16a34a", holdIfBookable: "HARD", flags: { inSheets: true } },
    released,
  ],
} as const satisfies Record<string, readonly ItemStateTemplateState[]>;

export type ItemStateTemplateKey = keyof typeof ITEM_STATE_TEMPLATES;
