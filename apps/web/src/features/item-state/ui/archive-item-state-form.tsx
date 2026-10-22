import type { ItemStateDto } from "@bibi/core/schemas";
import { Button, DialogFooter, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ArchivePreviewPanel } from "@/components/archive-preview/archive-preview-panel";
import { OptionSelectField } from "@/components/form/option-select-field";
import { useArchiveItemStateForm } from "./use-archive-item-state-form";

export type ArchiveItemStateFormProps = {
  state: ItemStateDto;
  targets: readonly ItemStateDto[];
  onDone: () => void;
};

/** Archive a state; its lines move to the chosen state of the same type. */
export function ArchiveItemStateForm({ state, targets, onDone }: ArchiveItemStateFormProps) {
  const t = useTranslations("itemState");
  const common = useTranslations("common");
  const { form, submit, pending, preview, loading, errorKey } = useArchiveItemStateForm({
    id: state.id,
    onDone,
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <OptionSelectField
          control={form.control}
          name="targetStateId"
          label={t("fields.targetState")}
          options={targets.map(({ id, name }) => ({ id, name }))}
          noneLabel={t("noTarget")}
        />
        <ArchivePreviewPanel preview={preview} loading={loading} errorKey={errorKey} unit="lines" />
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
