import type { RequirementDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { RequirementForm } from "./requirement-form";
import type { RequirementFormData } from "./requirement-form-data";

export type RequirementDialogProps = {
  data: RequirementFormData;
  ticketId: string;
  /** Present = edit mode, absent = create mode. */
  requirement?: RequirementDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RequirementDialog({ open, onOpenChange, ...props }: RequirementDialogProps) {
  const t = useTranslations("requirement");
  const editing = props.requirement !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {editing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <RequirementForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
