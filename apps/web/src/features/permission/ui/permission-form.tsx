"use client";

import { Form, FormController, FormItem, FormMessage } from "@okazi/ui";
import { PermissionGrid } from "./permission-grid";
import { type UsePermissionFormInput, usePermissionForm } from "./use-permission-form";

export type PermissionFormProps = UsePermissionFormInput;

/** The permission grid; each cell saves on change through `permission.update` with the full list. */
export function PermissionForm(props: PermissionFormProps) {
  const { form, change, pending, savingKey } = usePermissionForm(props);
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid min-w-0 gap-4">
        <FormController
          control={form.control}
          name="granted"
          render={({ field }) => (
            <FormItem className="min-w-0 [&>*]:min-w-0">
              <PermissionGrid
                value={field.value}
                pending={pending}
                savingKey={savingKey}
                onChange={(cell) => void change(cell)}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
