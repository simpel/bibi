import { FormController, FormItem, FormMessage } from "@okazi/ui";
import type { SetupForm } from "./setup-form";
import { validCells } from "./setup-form-schema";
import { SetupGridTable } from "./setup-grid-table";

export type GridStepProps = { form: SetupForm };

/** Step 4: phases down, item types across; each cell a state or "keep". */
export function GridStep({ form }: GridStepProps) {
  const phases = form.watch("phases");
  const itemTypes = form.watch("itemTypes");
  return (
    <FormController
      control={form.control}
      name="cells"
      render={({ field }) => (
        <FormItem>
          <SetupGridTable
            phases={phases}
            itemTypes={itemTypes}
            cells={validCells({ values: { phases, itemTypes, cells: field.value } })}
            onChange={field.onChange}
          />
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
