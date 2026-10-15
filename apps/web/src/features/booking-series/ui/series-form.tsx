import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { SeriesFields } from "./series-fields";
import type { SeriesFormData } from "./series-form-data";
import { useSeriesForm } from "./use-series-form";

export type SeriesFormProps = { data: SeriesFormData; onDone: () => void };

/** Create a series: booking type, the series' own fields, then the type's own fields. */
export function SeriesForm({ data, onDone }: SeriesFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("bookingSeries.fields");
  const { form, submit, pending, typeOf } = useSeriesForm({ data, onDone });
  const type = typeOf({ id: form.watch("entityTypeId") });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TypeSelectField
          control={form.control}
          types={data.types}
          label={t("type")}
          onTypeChange={(id) =>
            form.setValue("fields", rawFields({ type: typeOf({ id }), stored: {} }))
          }
        />
        {type ? (
          <>
            <SeriesFields form={form} data={data} />
            <TypeFields control={form.control} type={type} data={data} />
          </>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending || !type}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
