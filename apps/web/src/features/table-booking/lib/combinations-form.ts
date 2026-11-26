import { TableCombinationSaveInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { CombinationRow } from "./layout-tables";

export type CombinationsFormValues = { rows: CombinationRow[] };

/** What `tableCombination.save` takes. */
export type CombinationsSaveInput = z.infer<typeof TableCombinationSaveInputSchema>;

export type CombinationsSchemaInput = { layoutId: string };

/** Core's save schema over the editor's rows; the layout is the card's own. */
export function combinationsFormSchema({ layoutId }: CombinationsSchemaInput) {
  return formSchema({
    schema: TableCombinationSaveInputSchema,
    toInput: ({ values }: { values: CombinationsFormValues }) => ({
      layoutId,
      combinations: values.rows.map((row) => ({
        ...(row.id ? { id: row.id } : {}),
        name: row.name.trim(),
        elementIds: row.elementIds,
        minCovers: numberOrNull({ value: row.minCovers }),
        maxCovers: numberOrNull({ value: row.maxCovers }),
        onlineBookable: row.onlineBookable,
      })),
    }),
  });
}

export const NEW_COMBINATION: CombinationRow = {
  id: "",
  name: "",
  elementIds: [],
  minCovers: "",
  maxCovers: "",
  onlineBookable: true,
};
