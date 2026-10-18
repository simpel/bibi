import type { ItemStateDto } from "@okazi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ArchiveItemStateForm } from "./archive-item-state-form";

export type ArchiveItemStateDialogProps = {
  state: ItemStateDto;
  /** The type's active states; the others are where the state's lines can move. */
  states: readonly ItemStateDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive a state (ADR 0044): lines in it, grid cells and the expiry state move to a target. */
export function ArchiveItemStateDialog({
  state,
  states,
  open,
  onOpenChange,
}: ArchiveItemStateDialogProps) {
  const t = useTranslations("itemState");
  const targets = states.filter(({ id }) => id !== state.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("archive")}</DialogTitle>
          <DialogDescription>
            {t(state.initial ? "archiveInitialConfirm" : "archiveConfirm", { name: state.name })}
          </DialogDescription>
        </DialogHeader>
        <ArchiveItemStateForm state={state} targets={targets} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
