import type { FixedRole } from "@okazi/core/schemas";
import {
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@okazi/ui";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Control, FieldValues, Path } from "react-hook-form";

export type RoleSelectFieldProps<V extends FieldValues> = {
  control: Control<V>;
  name: Path<V>;
  /** Screen-reader label; the select sits in a table cell or next to a visible label. */
  label: string;
  placeholder: string;
  /** The roles the caller may give (`assignableRoles`). */
  roles: readonly FixedRole[];
  disabled: boolean;
  /** Shows a spinner next to the select while the save runs. */
  pending: boolean;
  /** Called with the picked role after the field value changed (auto-save). */
  onPick: (role: FixedRole) => void;
};

function SavingSpinner() {
  return <Loader2Icon className="size-4 animate-spin text-muted-foreground" aria-hidden />;
}

/** A fixed role as an auto-saving shadcn select, validation via `FormMessage`. */
export function RoleSelectField<V extends FieldValues>(props: RoleSelectFieldProps<V>) {
  const role = useTranslations("role");
  return (
    <FormController
      control={props.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="sr-only">{props.label}</FormLabel>
          <div className="flex items-center gap-2">
            <Select
              value={field.value}
              disabled={props.disabled || props.pending}
              onValueChange={(value) => {
                field.onChange(value);
                props.onPick(value as FixedRole);
              }}
            >
              <FormControl>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={props.placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {props.roles.map((value) => (
                  <SelectItem key={value} value={value}>
                    {role(value)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {props.pending ? <SavingSpinner /> : null}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
