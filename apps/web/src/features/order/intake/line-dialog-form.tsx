import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import { rawFields } from "@/components/typed-fields/raw-fields";
import { TypeFields } from "@/components/typed-fields/type-fields";
import { TypeSelectField } from "@/components/typed-fields/type-select-field";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { LineAddOnsField } from "./line-add-ons-field";
import { LineAvailabilityBox } from "./line-availability-box";
import { LineItemFields } from "./line-item-fields";
import { LineNeedsFields } from "./line-needs-fields";
import { LineQuantityField } from "./line-quantity-field";
import { type LineDialogFormApi, useLineDialogForm } from "./use-line-dialog-form";
import type { ReviewModel } from "./use-review-model";

export type LineDialogFormProps = {
  model: ReviewModel;
  item: CatalogItem | null;
  line: DraftLine | null;
  lineKey: string;
  onSave: (input: { line: DraftLine }) => void;
  onRemove?: () => void;
  onCancel: () => void;
};

type TimesProps = { form: LineDialogFormApi; date: string; timeZone: string };

/** The order's day read-only, then from and to (both empty: untimed). */
function TimeFields({ form, date, timeZone }: TimesProps) {
  const t = useTranslations("orderIntake.line");
  const dates = useDateTimeFormat();
  const day = dates.date({ instant: new Date(`${date}T12:00:00Z`), timeZone: "UTC" });
  return (
    <div className="grid items-start gap-4 sm:grid-cols-3">
      <div className="grid gap-2 text-sm">
        <span className="font-medium">{t("date")}</span>
        <span className="text-muted-foreground" title={timeZone}>
          {day}
        </span>
      </div>
      <TimeField form={form} name="from" label={t("from")} />
      <TimeField form={form} name="to" label={t("to")} />
    </div>
  );
}

function Footer({
  onRemove,
  onCancel,
  editing,
}: Pick<LineDialogFormProps, "onRemove" | "onCancel"> & { editing: boolean }) {
  const t = useTranslations("orderIntake.line");
  const common = useTranslations("common");
  return (
    <DialogFooter className="gap-2 sm:justify-between">
      {onRemove ? (
        <Button type="button" variant="destructive" onClick={onRemove}>
          {t("remove")}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {common("cancel")}
        </Button>
        <Button type="submit">{editing ? common("save") : t("add")}</Button>
      </div>
    </DialogFooter>
  );
}

/** The line itself: name, time, quantity, capability fields, needs, note and availability. */
export function LineDialogForm(props: LineDialogFormProps) {
  const t = useTranslations("orderIntake.line");
  const { model, item, line } = props;
  const { catalog } = model.data;
  const { form, submit, planned, date, timeZone } = useLineDialogForm(props);
  const type = catalog.lineTypes.find(({ id }) => id === form.watch("entityTypeId"));
  const quantity = Number(form.watch("quantity") || model.when.guests);
  const hidden = model.preview.status === "ready" && model.preview.availabilityHidden;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {!line && catalog.lineTypes.length > 1 ? (
          <TypeSelectField
            control={form.control}
            types={catalog.lineTypes}
            label={t("lineType")}
            onTypeChange={(id) =>
              form.setValue(
                "fields",
                rawFields({ type: catalog.lineTypes.find((each) => each.id === id), stored: {} }),
              )
            }
          />
        ) : null}
        <TextField form={form} name="name" label={t("name")} required />
        <TimeFields form={form} date={date} timeZone={timeZone} />
        <LineQuantityField form={form} headcount={model.when.guests} />
        <LineItemFields form={form} item={item} quantity={quantity} />
        <LineAddOnsField {...{ form, model, quantity }} />
        <LineNeedsFields form={form} values={catalog.needTypeId ? catalog.needValues : []} />
        <TextField form={form} name="note" label={t("note")} multiline />
        {type ? <TypeFields control={form.control} type={type} data={catalog} /> : null}
        <LineAvailabilityBox planned={planned} availabilityHidden={hidden} />
        <Footer onRemove={props.onRemove} onCancel={props.onCancel} editing={line !== null} />
      </form>
    </Form>
  );
}
