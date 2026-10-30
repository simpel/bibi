import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveBoardPhaseAction } from "../actions";

export type RemovePhaseDialogProps = {
  phase: { id: string; title: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** `boardPhase.archive`: the column goes; its statuses move to the tray, tickets are untouched. */
export function RemovePhaseDialog({ phase, open, onOpenChange }: RemovePhaseDialogProps) {
  const t = useTranslations("boardPhase");
  const router = useRouter();
  const { run, pending } = useToastAction();
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("remove")}
      description={t("removeConfirm", { name: phase.title })}
      confirmLabel={t("remove")}
      pending={pending}
      onConfirm={() =>
        run({
          action: () => archiveBoardPhaseAction({ id: phase.id }),
          messages: { pending: t("removing"), success: t("removed") },
          onSuccess: () => {
            onOpenChange(false);
            router.refresh();
          },
        })
      }
    />
  );
}
