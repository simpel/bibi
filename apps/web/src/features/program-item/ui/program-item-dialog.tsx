import type { ProgramItemDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { ProgramFormData } from "./program-form-data";
import { ProgramItemForm } from "./program-item-form";

export type ProgramItemDialogProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  programItem?: ProgramItemDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProgramItemDialog({ open, onOpenChange, ...props }: ProgramItemDialogProps) {
  const t = useTranslations("programItem");
  const editing = props.programItem !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {editing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <ProgramItemForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
