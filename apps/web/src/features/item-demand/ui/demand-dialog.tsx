import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { DemandForm, type DemandFormProps } from "./demand-form";

export type DemandDialogProps = Omit<DemandFormProps, "onDone"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DemandDialog({ open, onOpenChange, ...rest }: DemandDialogProps) {
  const t = useTranslations("itemDemand");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rest.demand ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        {open ? <DemandForm onDone={() => onOpenChange(false)} {...rest} /> : null}
      </DialogContent>
    </Dialog>
  );
}
