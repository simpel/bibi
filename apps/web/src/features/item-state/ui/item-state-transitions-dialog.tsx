import type { ItemStateDto } from "@bibi/core/schemas";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ItemStateTransitionsForm } from "./item-state-transitions-form";

export type ItemStateTransitionsDialogProps = {
  state: ItemStateDto;
  /** The type's active states; the state itself is left out of the choices. */
  states: readonly ItemStateDto[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Which states a line may move to from `state` (replaced as a set). */
export function ItemStateTransitionsDialog({
  state,
  states,
  open,
  onOpenChange,
}: ItemStateTransitionsDialogProps) {
  const t = useTranslations("itemState");
  const targets = states.filter((candidate) => candidate.id !== state.id);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTransitions")}</DialogTitle>
          <DialogDescription>
            {state.released
              ? t("releasedTransitions", { name: state.name })
              : t("transitionsDescription", { name: state.name })}
          </DialogDescription>
        </DialogHeader>
        <ItemStateTransitionsForm
          state={state}
          targets={targets}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
