import type { FieldDefinitionDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { FieldForm } from "./field-form";
import type { VocabularyChoice } from "./field-source-fields";

export type FieldDialogProps = {
  entityTypeId: string;
  field?: FieldDefinitionDto | undefined;
  vocabularies: VocabularyChoice[];
  linkTypes: VocabularyChoice[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FieldDialog({ field, open, onOpenChange, ...rest }: FieldDialogProps) {
  const t = useTranslations("fieldDefinition");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{field ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {field ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <FieldForm field={field} onDone={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
