import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useNewOrderStatusForm } from "@/features/order-status/ui/use-new-order-status-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createStatusOnBoardAction } from "../actions";

export type AddStatusFormProps = { onDone: () => void };

/**
 * A new order status made in customize mode: a name and a colour. It lands on no column (staff
 * drag it onto one) and may move freely (ADR 0076); its flags are set on the status page.
 */
export function AddStatusForm({ onDone }: AddStatusFormProps) {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useNewOrderStatusForm();
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createStatusOnBoardAction({ input: values }),
    messages: { pending: t("saving"), success: t("created") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-3">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TextField form={form} name="color" label={t("fields.color")} type="color" />
        <Button type="submit" size="sm" className="justify-self-end" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
