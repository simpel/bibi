import type { AlternativeGroupDto } from "@bibi/core/schemas";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { RenameAlternativeGroupForm } from "./rename-alternative-group-form";

export type RenameAlternativeGroupDialogProps = {
  group: AlternativeGroupDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Rename an alternative group (a tiny action, so a dialog). */
export function RenameAlternativeGroupDialog({
  group,
  open,
  onOpenChange,
}: RenameAlternativeGroupDialogProps) {
  const t = useTranslations("alternativeGroup");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rename")}</DialogTitle>
        </DialogHeader>
        <RenameAlternativeGroupForm group={group} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
