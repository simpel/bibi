import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createOrderStatusAction } from "../actions";
import { useNewOrderStatusForm } from "./use-new-order-status-form";

export type NewOrderStatusFormProps = { onDone: () => void };

/** Create a status: its name and colour. Flags and transitions are set when editing it. */
export function NewOrderStatusForm({ onDone }: NewOrderStatusFormProps) {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useNewOrderStatusForm();
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createOrderStatusAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TextField form={form} name="color" label={t("fields.color")} type="color" />
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
