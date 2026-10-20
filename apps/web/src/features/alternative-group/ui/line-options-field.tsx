import { Checkbox, FormController, FormItem, FormLabel, FormMessage, Label } from "@okazi/ui";
import type { UseFormReturn } from "react-hook-form";
import type { OptionLine } from "./option-line";
import type { AlternativeGroupFormValues } from "./use-alternative-group-form";

export type LineOptionsFieldProps<O> = {
  form: UseFormReturn<AlternativeGroupFormValues, unknown, O>;
  lines: OptionLine[];
  label: string;
};

/** The ticket's lines as checkboxes; the checked ones become the group's options. */
export function LineOptionsField<O>({ form, lines, label }: LineOptionsFieldProps<O>) {
  return (
    <FormController
      control={form.control}
      name="lineIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <div className="grid gap-2">
            {lines.map((line) => (
              <div key={line.id} className="flex items-center gap-2">
                <Checkbox
                  id={`option-${line.id}`}
                  checked={field.value.includes(line.id)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked
                        ? [...field.value, line.id]
                        : field.value.filter((id) => id !== line.id),
                    )
                  }
                />
                <Label htmlFor={`option-${line.id}`}>{line.name}</Label>
              </div>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
