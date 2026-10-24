import type { TicketStatusDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ArchivePreviewPanel } from "@/components/archive-preview/archive-preview-panel";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useArchiveTicketStatusForm } from "./use-archive-ticket-status-form";

export type ArchiveTicketStatusFormProps = {
  status: TicketStatusDto;
  /** Every other active status: where the status's tickets can move. */
  targets: readonly TicketStatusDto[];
  onDone: () => void;
};

/** Archive a status; its tickets move to the chosen status through the normal move checks. */
export function ArchiveTicketStatusForm({ status, targets, onDone }: ArchiveTicketStatusFormProps) {
  const t = useTranslations("ticketStatus");
  const common = useTranslations("common");
  const { form, submit, pending, preview, loading, errorKey } = useArchiveTicketStatusForm({
    id: status.id,
    onDone,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="targetStatusId"
          label={t("fields.targetStatus")}
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
