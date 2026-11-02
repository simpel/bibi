import type { EntityTypeDto } from "@bibi/core";
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
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { Control, Path } from "react-hook-form";
import { SoleOptionField } from "../form/sole-option-field";

type WithType = { entityTypeId: string };

export type TypeSelectFieldProps<V extends WithType, O> = {
  control: Control<V, unknown, O>;
  types: EntityTypeDto[];
  label: string;
  /** Called with the new type id after the value changed (the form resets the type's fields). */
  onTypeChange: (id: string) => void;
};

/** The type select itself. */
function TypeSelect<V extends WithType, O>({
  control,
  types,
  label,
  onTypeChange,
}: TypeSelectFieldProps<V, O>) {
  const t = useTranslations("common");
  return (
    <FormController
      control={control}
      name={"entityTypeId" as Path<V>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={String(field.value ?? "")}
            onValueChange={(id) => {
              field.onChange(id);
              onTypeChange(id);
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {types.map(({ id, name }) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * The record's type, chosen on create: it decides the own fields shown below it. With only one
 * type there is nothing to choose: the field is left out and takes that type.
 */
export function TypeSelectField<V extends WithType, O>(props: TypeSelectFieldProps<V, O>) {
  const [sole] = props.types;
  if (props.types.length !== 1 || !sole) return <TypeSelect {...props} />;
  const name = "entityTypeId" as Path<V>;
  return (
    <SoleOptionField
      control={props.control}
      name={name}
      id={sole.id}
      onChange={props.onTypeChange}
    />
  );
}
