import { QUANTITY_BASES, type TicketTemplateCreateInput } from "@okazi/core/schemas";
import { Button } from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { TicketTemplateFormData } from "./ticket-template-form-data";
import type { TicketTemplateFormValues } from "./ticket-template-form-schema";

type Form = UseFormReturn<TicketTemplateFormValues, unknown, TicketTemplateCreateInput>;

type LineFieldsProps = { form: Form; data: TicketTemplateFormData; index: number };

type NameInput = { index: number; key: string };

/** Form field name of one line's value, e.g. `lines.0.name`. */
const lineName = ({ index, key }: NameInput) => `lines.${index}.${key}` as never;

/** What the line is: its name, program item type and item. */
function LineWhatFields({ form, data, index }: LineFieldsProps) {
  const t = useTranslations("ticketTemplate");
  return (
    <>
      <TextField
        form={form}
        name={lineName({ index, key: "name" })}
        label={t("fields.lineName")}
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name={lineName({ index, key: "entityTypeId" })}
          label={t("fields.lineType")}
          options={data.lineTypes}
        />
        <OptionSelectField
          control={form.control}
          name={lineName({ index, key: "itemId" })}
          label={t("fields.item")}
          options={data.items}
          noneLabel={t("noItem")}
          onChange={() => form.setValue(lineName({ index, key: "setupId" }), "" as never)}
        />
      </div>
    </>
  );
}

/** When the line happens (from the ticket's start) and how many. */
function LineWhenFields({ form, index }: Omit<LineFieldsProps, "data">) {
  const t = useTranslations("ticketTemplate");
  const bases = QUANTITY_BASES.map((id) => ({ id, name: t(`basis.${id}`) }));
  const number = ({ key, label }: { key: string; label: string }) => (
    <TextField form={form} name={lineName({ index, key })} label={label} type="number" />
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {number({ key: "offsetMinutes", label: t("fields.offset") })}
        {number({ key: "durationMinutes", label: t("fields.duration") })}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {number({ key: "quantity", label: t("fields.quantity") })}
        <OptionSelectField
          control={form.control}
          name={lineName({ index, key: "quantityBasis" })}
          label={t("fields.basis")}
          options={bases}
        />
      </div>
    </>
  );
}

export type TemplateLineFieldsProps = LineFieldsProps & { onRemove: () => void };

/** One line of a predefined ticket. */
export function TemplateLineFields({ form, data, index, onRemove }: TemplateLineFieldsProps) {
  const t = useTranslations("ticketTemplate");
  return (
    <fieldset className="grid gap-4 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">{t("lineNumber", { number: index + 1 })}</legend>
      <LineWhatFields form={form} data={data} index={index} />
      <LineWhenFields form={form} index={index} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={onRemove}
      >
        <Trash2Icon />
        {t("removeLine")}
      </Button>
    </fieldset>
  );
}
