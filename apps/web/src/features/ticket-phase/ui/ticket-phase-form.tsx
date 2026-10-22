import type { TicketPhaseCreateInput, TicketPhaseDto } from "@bibi/core/schemas";
import { useRouter } from "@bibi/i18n/navigation";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import { useFormAction } from "@/lib/use-form-action";
import { createTicketPhaseAction, updateTicketPhaseAction } from "../actions";
import { PhaseFlagFields } from "./phase-flag-fields";
import { useTicketPhaseForm } from "./use-ticket-phase-form";

export type TicketPhaseFormProps = { phase?: TicketPhaseDto | undefined; onDone: () => void };

type SaveInput = { phase: TicketPhaseDto | undefined; values: TicketPhaseCreateInput };

const save = ({ phase, values }: SaveInput) =>
  phase
    ? updateTicketPhaseAction({ input: { id: phase.id, ...values } })
    : createTicketPhaseAction({ input: values });

/** Create (no `phase`) or edit form: name, color and the phase flags. */
export function TicketPhaseForm({ phase, onDone }: TicketPhaseFormProps) {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useTicketPhaseForm({ phase });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => save({ phase, values }),
    messages: { pending: t("saving"), success: t(phase ? "updated" : "created") },
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
        <PhaseFlagFields form={form} />
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
