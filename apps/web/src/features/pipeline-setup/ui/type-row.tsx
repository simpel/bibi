import { Badge, Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { typeFromOption } from "./setup-defaults";
import type { SetupForm } from "./setup-form";
import type { SetupTypeValues } from "./setup-form-schema";

export type TypeRowProps = {
  form: SetupForm;
  index: number;
  type: Pick<SetupTypeValues, "entityTypeId" | "name" | "bookable">;
  onRemove: () => void;
};

/** One item type of the setup: an existing one by name, or a new one's name and bookability. */
export function TypeRow({ form, index, type, onRemove }: TypeRowProps) {
  const t = useTranslations("pipelineSetup.types");
  // A new type starts again from its behaviour's template, so the holds match.
  const refill = ({ bookable }: { bookable: boolean }) => {
    const name = form.getValues(`itemTypes.${index}.name`);
    const fresh = typeFromOption({ option: { id: "", name, bookable } });
    form.setValue(`itemTypes.${index}.stateTemplate`, fresh.stateTemplate);
    form.setValue(`itemTypes.${index}.states`, fresh.states);
    form.setValue(`itemTypes.${index}.expiryState`, fresh.expiryState);
  };
  return (
    <fieldset className="grid gap-3 rounded-lg border p-4">
      <legend className="sr-only">{type.name || t("newType")}</legend>
      {type.entityTypeId ? (
        <div className="flex items-center gap-2">
          <span className="font-medium">{type.name}</span>
          {type.bookable ? <Badge variant="secondary">{t("bookable")}</Badge> : null}
        </div>
      ) : (
        <>
          <TextField form={form} name={`itemTypes.${index}.name`} label={t("name")} required />
          <CheckField
            form={form}
            name={`itemTypes.${index}.bookable`}
            label={t("isBookable")}
            onChange={({ checked }) => refill({ bookable: checked })}
          />
        </>
      )}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={onRemove}>
          {t("remove")}
        </Button>
      </div>
    </fieldset>
  );
}
