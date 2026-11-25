import type { OrderTemplateCreateInput } from "@bibi/core/schemas";

/** The parts of a template that are edited one at a time on its page. */
export type TemplateEditGroup = "picture" | "guests" | "type" | "status" | "lines";

const FIELDS = {
  picture: ["imageKey"],
  guests: ["minGuests", "maxGuests"],
  type: ["entityTypeId"],
  status: ["statusId"],
  lines: ["lines"],
} as const satisfies Record<TemplateEditGroup, readonly (keyof OrderTemplateCreateInput)[]>;

export type PickGroupsInput = {
  values: OrderTemplateCreateInput;
  groups: readonly TemplateEditGroup[];
};

/** Only the fields of `groups` from the whole form's output: an edit sends just its own part. */
export function pickGroups({ values, groups }: PickGroupsInput): Partial<OrderTemplateCreateInput> {
  const keys = groups.flatMap((group) => FIELDS[group]);
  return Object.fromEntries(keys.map((key) => [key, values[key]]));
}
