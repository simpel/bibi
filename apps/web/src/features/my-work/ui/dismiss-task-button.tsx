import { Button } from "@bibi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToastAction } from "@/lib/use-toast-action";
import { dismissNeedsYouTaskAction } from "../actions";

export type DismissTaskButtonProps = {
  taskKey: string;
  /** After the dismissal is saved: the panel dims the row until the next page. */
  onDismissed: (input: { key: string }) => void;
};

/**
 * The checkmark on a Needs you row (ADR 0114): asks first, then hides the task for the member
 * until its facts change. Colleagues who get the same task still see it.
 */
export function DismissTaskButton({ taskKey, onDismissed }: DismissTaskButtonProps) {
  const t = useTranslations("myWork.needsYou.dismiss");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  const confirm = () =>
    run({
      action: () => dismissNeedsYouTaskAction({ key: taskKey }),
      messages: { pending: common("saving"), success: t("done") },
      onSuccess: () => {
        setOpen(false);
        onDismissed({ key: taskKey });
      },
    });
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 bg-background"
        aria-label={t("label")}
        title={t("label")}
        onClick={() => setOpen(true)}
      >
        <CheckIcon />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("title")}
        description={t("description")}
        confirmLabel={t("confirm")}
        pending={pending}
        onConfirm={confirm}
        variant="default"
      />
    </>
  );
}
