import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { DraftLineDialog } from "./draft-line-dialog";
import { DraftLinesTable } from "./draft-lines-table";
import { EmptyLines } from "./empty-lines";
import type { useReviewActions } from "./use-review-actions";
import type { ReviewModel } from "./use-review-model";

export type LinesSectionProps = {
  model: ReviewModel;
  actions: ReturnType<typeof useReviewActions>;
};

/** The lines table, or the empty state with quick-add, and + Add line (build and review). */
export function LinesSection({ model, actions }: LinesSectionProps) {
  const t = useTranslations("orderIntake.review");
  return (
    <div className="grid gap-3">
      {model.review.lines.length > 0 ? (
        <DraftLinesTable model={model} onEdit={actions.open} onRemove={actions.remove} />
      ) : (
        <EmptyLines items={model.data.catalog.items} onQuickAdd={actions.quickAdd} />
      )}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => actions.open({ line: null })}
      >
        {t("addLine")}
      </Button>
    </div>
  );
}

/** The line dialog while it is open (outside the form: its own form submits only itself). */
export function LineDialogSlot({ model, actions }: LinesSectionProps) {
  if (!actions.dialog) return null;
  return (
    <DraftLineDialog
      {...{ model, line: actions.dialog.line, newKey: actions.dialog.newKey }}
      {...{ onSave: actions.save, onRemove: actions.remove, onClose: actions.close }}
    />
  );
}
