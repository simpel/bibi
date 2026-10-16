import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/** A bookable item a program item can be held in, with the ids of its setups. */
export type BookableOption = NamedOption & { setupIds: string[] };

/**
 * What the run schedule reads besides the program items: program item types and lists (own
 * fields), the bookable items and setups to pick from and the members who can be responsible
 * (`id` = user id).
 */
export type ProgramFormData = TypedFormData & {
  items: BookableOption[];
  setups: NamedOption[];
  members: NamedOption[];
};
