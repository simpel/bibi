import { Badge, Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import { TimeField } from "@/components/form/time-field";
import type { LineDialogFormApi } from "./use-line-dialog-form";

export type AddOnRowProps = {
  form: LineDialogFormApi;
  index: number;
  /** The item's price as written, or null for a free-text add-on. */
  price: string | null;
  /** The line's quantity, which the add-on follows while its own is empty. */
  lineQuantity: number;
  onRemove: () => void;
};

/** An added item: its quantity (the line's by default), its own time if set, and Remove. */
export function AddOnRow({ form, index, price, lineQuantity, onRemove }: AddOnRowProps) {
  const t = useTranslations("ticketIntake.line");
  const row = form.watch(`addOns.${index}`);
  return (
    <div className="grid gap-3 rounded-md border px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <Badge variant="outline">{t("addOn")}</Badge>
          {row.itemId ? <span className="truncate">{row.name}</span> : null}
          {price ? <span className="text-muted-foreground">{price}</span> : null}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
          {t("removeAddOn")}
        </Button>
      </div>
      {row.itemId ? null : (
        <TextField form={form} name={`addOns.${index}.name`} label={t("name")} required />
      )}
      <div className="grid items-start gap-4 sm:grid-cols-3">
        <TextField
          form={form}
          name={`addOns.${index}.quantity`}
          label={t("quantity")}
          type="number"
          step="1"
          placeholder={String(lineQuantity)}
        />
        <div className="sm:col-span-2 sm:pt-7">
          <CheckField form={form} name={`addOns.${index}.ownTime`} label={t("ownTime")} />
        </div>
      </div>
      {row.ownTime ? (
        <div className="grid items-start gap-4 sm:grid-cols-2">
          <TimeField form={form} name={`addOns.${index}.from`} label={t("from")} />
          <TimeField form={form} name={`addOns.${index}.to`} label={t("to")} />
        </div>
      ) : null}
    </div>
  );
}
