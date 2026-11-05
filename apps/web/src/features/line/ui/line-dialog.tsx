import type { LineDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { LineForm } from "./line-form";
import type { ProgramFormData } from "./program-form-data";

export type LineDialogProps = {
  data: ProgramFormData;
  orderId: string;
  startsAt: Date;
  /** Present = edit mode, absent = create mode. */
  line?: LineDto | undefined;
  /** Create mode: the top-level line the new line is an add-on of (ADR 0088). */
  parent?: LineDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LineDialog({ open, onOpenChange, ...props }: LineDialogProps) {
  const t = useTranslations("line");
  const editing = props.line !== undefined;
  const parent = editing ? undefined : props.parent;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? t("edit") : parent ? t("addAddOn") : t("create")}</DialogTitle>
          <DialogDescription>
            {editing
              ? t("editDescription")
              : parent
                ? t("addAddOnDescription", { name: parent.name })
                : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <LineForm {...props} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
