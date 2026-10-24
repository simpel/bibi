import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { AllocationSlots } from "./allocation-slots";
import { useLineAllocations } from "./use-line-allocations";

export type LineAllocationsDialogProps = {
  lineId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** The units held for a booking, one slot per demand of its item, each changeable (ADR 0059). */
export function LineAllocationsDialog({ lineId, open, onOpenChange }: LineAllocationsDialogProps) {
  const t = useTranslations("lineAllocation");
  const router = useRouter();
  const { state, reload } = useLineAllocations({ lineId, open });
  const onSaved = () => {
    router.refresh();
    void reload();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <AllocationSlots state={state} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  );
}
