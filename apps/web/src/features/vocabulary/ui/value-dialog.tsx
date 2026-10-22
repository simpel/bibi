import type { VocabularyValueDto } from "@bibi/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ValueForm } from "./value-form";

export type ValueDialogProps = {
  vocabularyId: string;
  value?: VocabularyValueDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ValueDialog({ vocabularyId, value, open, onOpenChange }: ValueDialogProps) {
  const t = useTranslations("vocabulary.value");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{value ? t("edit") : t("add")}</DialogTitle>
        </DialogHeader>
        <ValueForm vocabularyId={vocabularyId} value={value} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
