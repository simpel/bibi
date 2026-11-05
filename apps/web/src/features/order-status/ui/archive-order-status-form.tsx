import type { OrderStatusDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ArchivePreviewPanel } from "@/components/archive-preview/archive-preview-panel";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { useArchiveOrderStatusForm } from "./use-archive-order-status-form";

export type ArchiveOrderStatusFormProps = {
  status: OrderStatusDto;
  /** Every other active status: where the status's orders can move. */
  targets: readonly OrderStatusDto[];
  onDone: () => void;
};

/** Archive a status; its orders move to the chosen status through the normal move checks. */
export function ArchiveOrderStatusForm({ status, targets, onDone }: ArchiveOrderStatusFormProps) {
  const t = useTranslations("orderStatus");
  const common = useTranslations("common");
  const { form, submit, pending, preview, loading, errorKey } = useArchiveOrderStatusForm({
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
          unit="orders"
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
