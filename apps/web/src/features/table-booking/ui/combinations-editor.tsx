"use client";

import {
  Button,
  Form,
  FormControl,
  FormController,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFieldArray, useForm } from "react-hook-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { zodMessageMap } from "@/lib/zod-error-map";
import { saveCombinationsAction } from "../actions";
import {
  type CombinationsFormValues,
  type CombinationsSaveInput,
  combinationsFormSchema,
  NEW_COMBINATION,
} from "../lib/combinations-form";
import type { CombinationRow, TableRow } from "../lib/layout-tables";

export type CombinationsEditorProps = {
  layoutId: string;
  tables: readonly TableRow[];
  combinations: readonly CombinationRow[];
  canEdit: boolean;
};

/** Tables booked together for one party. Rows are edited, then the whole set is saved. */
export function CombinationsEditor({
  layoutId,
  tables,
  combinations,
  canEdit,
}: CombinationsEditorProps) {
  const t = useTranslations("tableBooking.combinations");
  const common = useTranslations("common");
  const errors = useTranslations("errors");
  const router = useRouter();
  const form = useForm<CombinationsFormValues, unknown, CombinationsSaveInput>({
    resolver: zodResolver(combinationsFormSchema({ layoutId }), {
      error: zodMessageMap({ translate: (key) => errors(key) }),
    }),
    defaultValues: { rows: [...combinations] },
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "rows" });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => saveCombinationsAction({ input: values }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        {fields.map((row, index) => (
          <div key={row.id} className="grid gap-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_auto] sm:items-end">
              <FormController
                control={form.control}
                name={`rows.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canEdit} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(["minCovers", "maxCovers"] as const).map((name) => (
                <FormController
                  key={name}
                  control={form.control}
                  name={`rows.${index}.${name}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t(name)}</FormLabel>
                      <FormControl>
                        <Input {...field} inputMode="numeric" disabled={!canEdit} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
              <FormController
                control={form.control}
                name={`rows.${index}.onlineBookable`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <Switch
                      checked={field.value}
                      disabled={!canEdit}
                      onCheckedChange={field.onChange}
                      aria-label={t("online")}
                    />
                    <FormLabel>{t("online")}</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <FormController
              control={form.control}
              name={`rows.${index}.elementIds`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("tables")}</FormLabel>
                  <fieldset className="flex flex-wrap gap-1.5">
                    <legend className="sr-only">{t("tables")}</legend>
                    {tables.map((table) => {
                      const on = field.value.includes(table.id);
                      return (
                        <Button
                          key={table.id}
                          type="button"
                          size="sm"
                          variant={on ? "default" : "outline"}
                          aria-pressed={on}
                          disabled={!canEdit}
                          onClick={() =>
                            field.onChange(
                              on
                                ? field.value.filter((id) => id !== table.id)
                                : [...field.value, table.id],
                            )
                          }
                        >
                          {table.label || "–"}
                        </Button>
                      );
                    })}
                  </fieldset>
                  <FormMessage />
                </FormItem>
              )}
            />
            {canEdit ? (
              <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)}>
                  <Trash2Icon />
                  {t("delete")}
                </Button>
              </div>
            ) : null}
          </div>
        ))}
        {fields.length === 0 ? <p className="text-sm text-muted-foreground">{t("none")}</p> : null}
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={tables.length < 2}
              onClick={() => append({ ...NEW_COMBINATION })}
            >
              <PlusIcon />
              {t("create")}
            </Button>
            <Button type="submit" disabled={pending || !form.formState.isDirty}>
              {common("save")}
            </Button>
          </div>
        ) : null}
      </form>
    </Form>
  );
}
