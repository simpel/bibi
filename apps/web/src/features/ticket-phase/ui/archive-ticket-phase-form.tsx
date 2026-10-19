import type { TicketPhaseDto } from "@okazi/core/schemas";
import { Button, DialogFooter, Form } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ArchivePreviewPanel } from "@/components/archive-preview/archive-preview-panel";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useArchiveTicketPhaseForm } from "./use-archive-ticket-phase-form";

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
  const { form, submit, pending, preview, loading, errorKey } = useArchiveTicketPhaseForm({
    id: phase.id,
    onDone,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="targetPhaseId"
          label={t("fields.targetPhase")}
          options={targets.map(({ id, name }) => ({ id, name }))}
          noneLabel={t("noTarget")}
        />
        <TextField form={form} name="reason" label={t("fields.reason")} multiline />
        <ArchivePreviewPanel
          preview={preview}
          loading={loading}
          errorKey={errorKey}
          unit="tickets"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button
            type="submit"
            variant="destructive"
            disabled={pending || loading || !preview?.archivable}
          >
            {t("archive")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
