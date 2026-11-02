import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { CatalogItem } from "./catalog";
import type { DraftLine } from "./draft-line";
import { ItemSearch } from "./item-search";
import { LineDialogForm } from "./line-dialog-form";
import type { ReviewModel } from "./use-review-model";

/** The dialog's line: none yet (search), free text, or an item. */
type Choice = { stage: "search" } | { stage: "form"; item: CatalogItem | null };

export type DraftLineDialogProps = {
  model: ReviewModel;
  /** The line being edited; null adds one. */
  line: DraftLine | null;
  /** The key a new line gets. */
  newKey: string;
  onSave: (input: { line: DraftLine }) => void;
  onRemove: (input: { key: string }) => void;
  onClose: () => void;
};

const initial = ({ model, line }: Pick<DraftLineDialogProps, "model" | "line">): Choice => {
  if (!line) return { stage: "search" };
  const item = model.data.catalog.items.find(({ id }) => id === line.itemId) ?? null;
  return { stage: "form", item };
};

type LineForInput = { line: DraftLine | null; item: CatalogItem | null; items: CatalogItem[] };

/** An edited line moved to another item keeps its times and needs, not its setup or choices. */
function lineFor({ line, item, items }: LineForInput): DraftLine | null {
  if (!line || line.itemId === (item?.id ?? null)) return line;
  const before = items.find(({ id }) => id === line.itemId);
  const name = before && before.name === line.name && item ? item.name : line.name;
  return { ...line, name, itemId: item?.id ?? null, setupId: null, options: [] };
}

type ChosenLineProps = DraftLineDialogProps & {
  item: CatalogItem | null;
  onChangeItem: () => void;
};

/** The chosen item (or free text) with Change item, then the line's form. */
function ChosenLine({
  model,
  line,
  newKey,
  item,
  onSave,
  onRemove,
  onClose,
  onChangeItem,
}: ChosenLineProps) {
  const t = useTranslations("ticketIntake.line");
  const key = line?.key ?? newKey;
  return (
    <>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">
          {item ? `${item.name} · ${item.typeName}` : t("freeTextLine")}
        </span>
        <Button type="button" variant="link" size="sm" onClick={onChangeItem}>
          {t("changeItem")}
        </Button>
      </div>
      <LineDialogForm
        key={item?.id ?? "free"}
        {...{ model, item, lineKey: key, onSave }}
        line={lineFor({ line, item, items: model.data.catalog.items })}
        onRemove={line ? () => onRemove({ key }) : undefined}
        onCancel={onClose}
      />
    </>
  );
}

/**
 * Add or edit a draft line (spec "The line dialog"): what it is (an item or free text), then the
 * line. Nothing is saved until Create; Save only changes the review.
 */
export function DraftLineDialog(props: DraftLineDialogProps) {
  const t = useTranslations("ticketIntake.line");
  const { model, line, onClose } = props;
  const [choice, setChoice] = useState<Choice>(() => initial({ model, line }));
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{line ? t("editTitle") : t("addTitle")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        {choice.stage === "search" ? (
          <ItemSearch
            model={model}
            onItem={({ item }) => setChoice({ stage: "form", item })}
            onFreeText={() => setChoice({ stage: "form", item: null })}
          />
        ) : (
          <ChosenLine
            {...props}
            item={choice.item}
            onChangeItem={() => setChoice({ stage: "search" })}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
