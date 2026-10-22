import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { type AiFeatureRow, FEATURE_KEY } from "./model-options";
import { ModelSelectField } from "./model-select-field";
import { useModelSelect } from "./use-model-select";

export type ModelSelectFormProps = { row: AiFeatureRow };

/**
 * One row's model picker: a shadcn form that saves on pick through the server action, with one
 * toast per save. The embedding feature asks first (its search index must be rebuilt).
 */
export function ModelSelectForm({ row: { setting, models } }: ModelSelectFormProps) {
  const t = useTranslations("admin.aiModels");
  const { form, submit, pending, confirming, pick, confirm, cancel } = useModelSelect({ setting });
  const feature = t(`features.${FEATURE_KEY[setting.id]}.name`);
  return (
    <Form {...form}>
      <form onSubmit={submit}>
        <ModelSelectField
          control={form.control}
          label={t("modelLabel", { feature })}
          placeholder={t("choose")}
          models={models ?? []}
          disabled={!models || models.length === 0 || pending}
          onPick={pick}
        />
      </form>
      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => (open ? undefined : cancel())}
        title={t("reindexTitle")}
        description={t("reindexDescription")}
        confirmLabel={t("reindexConfirm")}
        pending={pending}
        onConfirm={confirm}
      />
    </Form>
  );
}
