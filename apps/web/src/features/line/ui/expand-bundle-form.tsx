import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { ExpandBundlePickFields } from "./expand-bundle-pick-fields";
import type { ProgramFormData } from "./program-form-data";
import { useExpandBundleForm } from "./use-expand-bundle-form";

export type ExpandBundleFormProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
  onDone: () => void;
};

/** The bundle, the line type, its name, time and quantity: `line.expandBundle` (ADR 0059). */
export function ExpandBundleForm({ data, ticketId, startsAt, onDone }: ExpandBundleFormProps) {
  const t = useTranslations("line");
  const common = useTranslations("common");
  const { form, submit, pending } = useExpandBundleForm({
    ...{ ticketId, startsAt, onDone },
    entityTypeId: data.types[0]?.id ?? "",
    itemId: data.bundles[0]?.id ?? "",
  });
  const time = { form, type: "datetime-local" } as const;
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <ExpandBundlePickFields form={form} data={data} />
        <TextField form={form} name="name" label={t("bundleFields.name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField {...time} name="startsAt" label={t("fields.startsAt")} />
          <TextField {...time} name="endsAt" label={t("fields.endsAt")} />
        </div>
        <TextField form={form} name="quantity" label={t("fields.quantity")} type="number" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
