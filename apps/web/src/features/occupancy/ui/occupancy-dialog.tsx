import type { OccupancyDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { OccupancyForm } from "./occupancy-form";

export type OccupancyDialogProps = {
  itemId: string;
  /** Present = edit mode, absent = create mode. */
  occupancy?: OccupancyDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OccupancyDialog({ open, onOpenChange, ...rest }: OccupancyDialogProps) {
  const t = useTranslations("occupancy");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rest.occupancy ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <OccupancyForm onDone={() => onOpenChange(false)} {...rest} />
      </DialogContent>
    </Dialog>
  );
}
