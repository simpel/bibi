import type { TicketStatusCreateInput, TicketStatusDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createTicketStatusAction, updateTicketStatusAction } from "../actions";
import { StatusFlagFields } from "./status-flag-fields";
import { useTicketStatusForm } from "./use-ticket-status-form";

export type TicketStatusFormProps = {
  ticketStatus?: TicketStatusDto | undefined;
  onDone: () => void;
};

type SaveInput = { ticketStatus: TicketStatusDto | undefined; values: TicketStatusCreateInput };

const save = ({ ticketStatus, values }: SaveInput) =>
  ticketStatus
    ? updateTicketStatusAction({ input: { id: ticketStatus.id, ...values } })
    : createTicketStatusAction({ input: values });

/** Create (no `status`) or edit form: name, color and the status flags. */
export function TicketStatusForm({ ticketStatus, onDone }: TicketStatusFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTicketStatusForm({ ticketStatus });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ ticketStatus, values }),
    messages: { pending: t("saving"), success: t(ticketStatus ? "updated" : "created") },
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
