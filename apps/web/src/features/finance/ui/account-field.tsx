import {
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@bibi/ui";
import type { Control, FieldValues, Path } from "react-hook-form";

export type AccountFieldProps<V extends FieldValues, O> = {
  control: Control<V, unknown, O>;
  name: Path<V>;
  label: string;
  /** The BAS default, or what an empty field means. */
  hint: string;
};

/** A four-digit account number with its hint under the input. */
export function AccountField<V extends FieldValues, O>({
  control,
  name,
  label,
  hint,
}: AccountFieldProps<V, O>) {
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input inputMode="numeric" maxLength={4} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormDescription>{hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
