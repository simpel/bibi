import type { SetupDto } from "@bibi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { SetupForm } from "./setup-form";

export type SetupDialogProps = {
  /** Present = edit mode, absent = create mode. */
  setup?: SetupDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SetupDialog({ setup, open, onOpenChange }: SetupDialogProps) {
  const t = useTranslations("setup");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{setup ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {setup ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <SetupForm setup={setup} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
