import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { StatusFlagFields } from "@/features/ticket-status/ui/status-flag-fields";
import { useTicketStatusForm } from "@/features/ticket-status/ui/use-ticket-status-form";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { createStatusOnBoardAction } from "../actions";

export type AddStatusFormProps = {
  boardId: string;
  /** The column to put it in; null = no column (it gets its own on the default board). */
  phaseId: string | null;
  onDone: () => void;
};

/**
 * A new ticket status made in customize mode: name, colour and flags (ADR 0043). It lands in
 * `phaseId` and gets default transitions; flag conflicts show as the core error.
 */
export function AddStatusForm({ boardId, phaseId, onDone }: AddStatusFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTicketStatusForm({});
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      createStatusOnBoardAction({ input: { ...values, ...(phaseId ? { phaseId } : {}) }, boardId }),
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
        <StatusFlagFields form={form} />
        <Button type="submit" size="sm" className="justify-self-end" disabled={pending}>
          {common("save")}
        </Button>
      </form>
    </Form>
  );
}
