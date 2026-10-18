import { zodResolver } from "@hookform/resolvers/zod";
import type { TicketPhaseArchiveInput, TicketPhaseDto } from "@okazi/core/schemas";
import { TicketPhaseArchiveInputSchema } from "@okazi/core/schemas";
import { useRouter } from "@okazi/i18n/navigation";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { formSchema } from "@/lib/form-schema";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { archiveTicketPhaseAction } from "../actions";

type Values = { targetPhaseId: string; reason: string };

const archiveSchema = ({ id }: { id: string }) =>
  formSchema({
    schema: TicketPhaseArchiveInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id,
      ...(values.targetPhaseId && values.targetPhaseId !== NONE
        ? { targetPhaseId: values.targetPhaseId }
        : {}),
      ...(values.reason.trim() ? { reason: values.reason } : {}),
    }),
  });

const useArchiveForm = ({ id }: { id: string }) =>
  useForm<Values, unknown, TicketPhaseArchiveInput>({
    resolver: zodResolver(archiveSchema({ id }), useZodMessages()),
    defaultValues: { targetPhaseId: NONE, reason: "" },
  });

export type ArchiveTicketPhaseFormProps = {
  phase: TicketPhaseDto;
  /** Every other active phase: where the phase's tickets can move. */
  targets: readonly TicketPhaseDto[];
  onDone: () => void;
};

/** Archive a phase; its tickets move to the chosen phase through the normal move checks. */
export function ArchiveTicketPhaseForm({ phase, targets, onDone }: ArchiveTicketPhaseFormProps) {
  const t = useTranslations("ticketPhase");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useArchiveForm({ id: phase.id });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => archiveTicketPhaseAction({ input: values }),
    messages: { pending: t("archiving"), success: t("archived") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const options = targets.map(({ id, name }) => ({ id, name }));
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="targetPhaseId"
          label={t("fields.targetPhase")}
          options={options}
          noneLabel={t("noTarget")}
        />
        <TextField form={form} name="reason" label={t("fields.reason")} multiline />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" variant="destructive" disabled={pending}>
            {t("archive")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
