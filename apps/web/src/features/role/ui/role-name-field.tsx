import type { RoleCreateInput } from "@okazi/core";
import { FormControl, FormController, FormItem, FormLabel, FormMessage, Input } from "@okazi/ui";
import type { Control } from "react-hook-form";

export type RoleNameFieldProps = { control: Control<RoleCreateInput>; label: string };

export function RoleNameField({ control, label }: RoleNameFieldProps) {
  return (
    <FormController
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
