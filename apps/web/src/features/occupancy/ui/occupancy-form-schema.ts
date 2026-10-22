import type { OccupancyDto, OccupancyUpdateInput } from "@bibi/core";
import { OccupancyCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "./local-date-time";

export type ManualOccupancyType = "MAINTENANCE" | "INTERNAL";

/** Raw values of the block form; the item is fixed by the page. */
export type OccupancyFormValues = {
  type: ManualOccupancyType;
  startsAt: string;
  endsAt: string;
  note: string;
};

export type OccupancyFormOutput = z.infer<typeof OccupancyCreateInputSchema>;

export type OccupancyDefaultsInput = { occupancy?: OccupancyDto | undefined };

export const occupancyFormDefaults = ({ occupancy }: OccupancyDefaultsInput) =>
  ({
    type: occupancy?.type === "INTERNAL" ? "INTERNAL" : "MAINTENANCE",
    startsAt: occupancy ? toLocalInputValue({ date: occupancy.startsAt }) : "",
    endsAt: occupancy ? toLocalInputValue({ date: occupancy.endsAt }) : "",
    note: occupancy?.note ?? "",
  }) satisfies OccupancyFormValues;

export type OccupancySchemaInput = { itemId: string };

/** Core's create schema is the single source of validation rules for the form. */
export const occupancyFormSchema = ({ itemId }: OccupancySchemaInput) =>
  formSchema({
    schema: OccupancyCreateInputSchema,
    toInput: ({ values }: { values: OccupancyFormValues }) => ({
      itemId,
      type: values.type,
      startsAt: fromLocalInputValue({ value: values.startsAt }),
      endsAt: fromLocalInputValue({ value: values.endsAt }),
      note: blankToNull({ value: values.note }),
    }),
  });

export type OccupancyUpdateArgs = { occupancy: OccupancyDto; values: OccupancyFormOutput };

/** Create-shaped values → `occupancy.update` input (the item cannot change). */
export function toOccupancyUpdate({
  occupancy,
  values,
}: OccupancyUpdateArgs): OccupancyUpdateInput {
  const { itemId: _item, ...rest } = values;
  return { id: occupancy.id, ...rest };
}
