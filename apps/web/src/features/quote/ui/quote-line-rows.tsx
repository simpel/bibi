import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import type { NamedOption } from "@/components/form/named-option";
import { EMPTY_LINE, type QuoteFormOutput, type QuoteFormValues } from "./quote-form-schema";
import { QuoteLineRow } from "./quote-line-row";

export type QuoteLineRowsProps = {
  form: UseFormReturn<QuoteFormValues, unknown, QuoteFormOutput>;
  items: readonly NamedOption[];
};

/** The editable order lines and "add line"; the set replaces the quote's lines on save. */
export function QuoteLineRows({ form, items }: QuoteLineRowsProps) {
  const t = useTranslations("quote.lines");
  const rows = useFieldArray({ control: form.control, name: "lines" });
  return (
    <div className="grid gap-3">
      <p className="text-sm font-medium">{t("title")}</p>
      {rows.fields.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("none")}</p>
      ) : null}
      {rows.fields.map((field, index) => (
        <QuoteLineRow
          key={field.id}
          form={form}
          index={index}
          items={items}
          onRemove={() => rows.remove(index)}
        />
      ))}
      <p className="text-sm text-muted-foreground">{t("priceHint")}</p>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => rows.append(EMPTY_LINE)}>
          <PlusIcon className="size-4" />
          {t("add")}
        </Button>
      </div>
    </div>
  );
}
