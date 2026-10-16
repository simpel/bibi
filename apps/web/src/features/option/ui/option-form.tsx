import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useOptionForm } from "./use-option-form";

export type OptionFormProps = { itemId: string; onDone: () => void };

/** Place an option on a bookable item: held period, expiry and note. The rank is automatic. */
export function OptionForm({ itemId, onDone }: OptionFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("option.fields");
  const { form, submit, pending } = useOptionForm({ itemId, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            form={form}
            name="startsAt"
            label={t("startsAt")}
            type="datetime-local"
            required
          />
          <TextField form={form} name="endsAt" label={t("endsAt")} type="datetime-local" required />
        </div>
        <TextField
          form={form}
          name="expiresAt"
          label={t("expiresAt")}
          type="datetime-local"
          required
        />
        <TextField form={form} name="note" label={t("note")} multiline rows={2} />
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
