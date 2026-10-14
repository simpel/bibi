import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { EntityTypeForm } from "./entity-type-form";

export type EntityTypeDialogProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** Create-type dialog. Editing happens inline on the type's detail page. */
export function EntityTypeDialog({ open, onOpenChange }: EntityTypeDialogProps) {
  const t = useTranslations("entityType");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription>{t("createDescription")}</DialogDescription>
        </DialogHeader>
        <EntityTypeForm onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
