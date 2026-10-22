import type { FixedRole } from "@bibi/core/schemas";
import {
  ChoiceControl,
  FormControl,
  FormController,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control, FieldValues, Path } from "react-hook-form";

export type RoleFieldProps<V extends FieldValues> = {
  control: Control<V>;
  name: Path<V>;
  /** The roles the caller may give (`assignableRoles`). */
  roles: readonly FixedRole[];
};

/** One of the fixed roles as a select, with what the chosen role may do. */
export function RoleField<V extends FieldValues>({ control, name, roles }: RoleFieldProps<V>) {
  const t = useTranslations("member");
  const role = useTranslations("role");
  const choices = roles.map((value) => ({ value, label: role(value) }));
  return (
    <FormController
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("columns.roles")}</FormLabel>
          <FormControl>
            <ChoiceControl
              value={field.value}
              onChange={field.onChange}
              choices={choices}
              placeholder={t("selectRole")}
            />
          </FormControl>
          {roles.includes(field.value) ? (
            <FormDescription>{role(`descriptions.${field.value as FixedRole}`)}</FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
