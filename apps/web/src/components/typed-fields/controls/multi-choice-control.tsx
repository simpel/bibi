import { Checkbox } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ChoiceControlProps } from "./control-props";

/** MULTI_CHOICE field: a checkbox per allowed value. */
export function MultiChoiceControl(props: ChoiceControlProps<string[]>) {
  const { value, onChange, choices, id, ...aria } = props;
  const t = useTranslations("common");
  const toggle = ({ choice, checked }: { choice: string; checked: boolean }) =>
    onChange(checked ? [...value, choice] : value.filter((item) => item !== choice));
  if (choices.length === 0)
    return <p className="text-sm text-muted-foreground">{t("noOptions")}</p>;
  return (
    <fieldset id={id} className="grid gap-2 border-0 p-0 sm:grid-cols-2" {...aria}>
      {choices.map(({ value: choice, label }) => (
        <div key={choice} className="flex items-center gap-2 text-sm">
          <Checkbox
            id={`${id}-${choice}`}
            checked={value.includes(choice)}
            onCheckedChange={(checked) => toggle({ choice, checked: checked === true })}
          />
          <label htmlFor={`${id}-${choice}`}>{label}</label>
        </div>
      ))}
    </fieldset>
  );
}
