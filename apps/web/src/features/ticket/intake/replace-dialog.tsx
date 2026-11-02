import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";

export type ReplaceDialogProps = {
  /** The lines that would be replaced. */
  count: number;
  onReplace: () => void;
  onCancel: () => void;
};

/** Lines from another pick exist (spec "Replacing lines"): replace them, or keep them. */
export function ReplaceDialog({ count, onReplace, onCancel }: ReplaceDialogProps) {
  const t = useTranslations("ticketIntake.replace");
  const common = useTranslations("common");
  return (
    <Dialog open onOpenChange={(open) => !open && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title", { count })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            {common("cancel")}
          </Button>
          <Button type="button" onClick={onReplace}>
            {t("replace")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
