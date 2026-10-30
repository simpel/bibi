import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createTicketStatusAction } from "../actions";
import { useNewTicketStatusForm } from "./use-new-ticket-status-form";

export type NewTicketStatusFormProps = { onDone: () => void };

/** Create a status: its name and colour. Flags and transitions are set when editing it. */
export function NewTicketStatusForm({ onDone }: NewTicketStatusFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useNewTicketStatusForm();
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => createTicketStatusAction({ input: values }),
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
