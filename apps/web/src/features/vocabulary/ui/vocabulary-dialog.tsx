import type { VocabularyDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { VocabularyForm } from "./vocabulary-form";

export type VocabularyDialogProps = {
  /** Present = rename mode, absent = create mode. */
  vocabulary?: VocabularyDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function VocabularyDialog({ vocabulary, open, onOpenChange }: VocabularyDialogProps) {
  const t = useTranslations("vocabulary");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{vocabulary ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {vocabulary ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <VocabularyForm vocabulary={vocabulary} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
