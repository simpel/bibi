import type { LineDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { LineForm } from "./line-form";
import type { ProgramFormData } from "./program-form-data";

export type LineDialogProps = {
  data: ProgramFormData;
  ticketId: string;
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  line?: LineDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LineDialog({ open, onOpenChange, ...props }: LineDialogProps) {
  const t = useTranslations("line");
  const editing = props.line !== undefined;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {editing ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <LineForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
