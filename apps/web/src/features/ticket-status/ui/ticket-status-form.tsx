import type { TicketStatusDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { updateTicketStatusAction } from "../actions";
import { StatusFlagFields } from "./status-flag-fields";
import { useTicketStatusForm } from "./use-ticket-status-form";

export type TicketStatusFormProps = { ticketStatus: TicketStatusDto; onDone: () => void };

/** The status edit form: name, color and the status flags (a new status is `NewTicketStatusForm`). */
export function TicketStatusForm({ ticketStatus, onDone }: TicketStatusFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTicketStatusForm({ ticketStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => updateTicketStatusAction({ input: { id: ticketStatus.id, ...values } }),
    messages: { pending: t("saving"), success: t("updated") },
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
        <StatusFlagFields form={form} />
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
