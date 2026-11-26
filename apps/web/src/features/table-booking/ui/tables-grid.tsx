"use client";

import { Button, Form, FormControl, FormController, FormItem, Input, Switch } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { saveTablesAction } from "../actions";
import type { TableRow } from "../lib/layout-tables";

type Values = { rows: TableRow[] };

export type TablesGridProps = { layoutId: string; tables: readonly TableRow[]; canEdit: boolean };

const numberOrNull = ({ value }: { value: string }) => {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
};

function NumberCell({ form, index, name, label }: CellProps) {
  return (
    <FormController
      control={form.control}
      name={`rows.${index}.${name}`}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input {...field} inputMode="numeric" aria-label={label} className="w-20" />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

type CellProps = {
  form: ReturnType<typeof useForm<Values>>;
  index: number;
  name: "label" | "minCovers" | "maxCovers";
  label: string;
};

/** The layout's seated pieces: number, people range and whether guests may book each online. */
export function TablesGrid({ layoutId, tables, canEdit }: TablesGridProps) {
  const t = useTranslations("tableBooking.tables");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<Values>({ defaultValues: { rows: [...tables] } });
  const { fields } = useFieldArray({ control: form.control, name: "rows" });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveTablesAction({
        layoutId,
        tables: values.rows.map((row) => ({
          id: row.id,
          label: row.label.trim() === "" ? null : row.label.trim(),
          minCovers: numberOrNull({ value: row.minCovers }),
          maxCovers: numberOrNull({ value: row.maxCovers }),
          onlineBookable: row.onlineBookable,
        })),
      }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  if (tables.length === 0) return <p className="text-sm text-muted-foreground">{t("none")}</p>;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <fieldset disabled={!canEdit} className="grid gap-2">
          <div className="grid grid-cols-[5rem_3rem_5rem_5rem_1fr] items-end gap-3 text-xs text-muted-foreground">
            <span>{t("label")}</span>
            <span>{t("seats")}</span>
            <span>{t("minCovers")}</span>
            <span>{t("maxCovers")}</span>
            <span>{t("online")}</span>
          </div>
          {fields.map((row, index) => (
            <div
              key={row.id}
              className="grid grid-cols-[5rem_3rem_5rem_5rem_1fr] items-center gap-3"
            >
              <NumberCell form={form} index={index} name="label" label={t("label")} />
              <span className="tabular-nums">{row.seats}</span>
              <NumberCell form={form} index={index} name="minCovers" label={t("minCovers")} />
              <NumberCell form={form} index={index} name="maxCovers" label={t("maxCovers")} />
              <FormController
                control={form.control}
                name={`rows.${index}.onlineBookable`}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-label={t("online")}
                  />
                )}
              />
            </div>
          ))}
        </fieldset>
        {canEdit ? (
          <div>
            <Button type="submit" disabled={pending || !form.formState.isDirty}>
              {common("save")}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
