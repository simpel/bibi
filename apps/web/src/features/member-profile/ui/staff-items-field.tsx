import { Checkbox, FormControl, FormController, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import type { StaffOption } from "../load-member-work";
import type { MemberWorkValues } from "./use-member-work-form";

export type StaffItemsFieldProps = {
  control: Control<MemberWorkValues>;
  options: readonly StaffOption[];
};

/** The active staff items as checkboxes; server issues on `itemIds.<i>` show under the list. */
export function StaffItemsField({ control, options }: StaffItemsFieldProps) {
  const t = useTranslations("memberProfile");
  return (
    <FormController
      control={control}
      name="itemIds"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("staffItems")}</FormLabel>
          {options.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noStaffItems")}</p>
          ) : null}
          {options.map(({ id, name, typeName }) => (
            <div key={id} className="flex items-center gap-2">
              <FormControl>
                <Checkbox
                  id={`staff-${id}`}
                  checked={field.value.includes(id)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked === true
                        ? [...field.value, id]
                        : field.value.filter((value) => value !== id),
                    )
                  }
                />
              </FormControl>
              <label htmlFor={`staff-${id}`} className="text-sm">
                {name}
                <span className="ml-2 text-muted-foreground">{typeName}</span>
              </label>
            </div>
          ))}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
