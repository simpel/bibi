import { useRouter } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import type { ToastMessages } from "@/lib/submit-with-toast";
import { useToastAction } from "@/lib/use-toast-action";
import { ConfirmDialog } from "./confirm-dialog";

export type ConfirmActionButtonProps<R> = {
  label: string;
  description: string;
  messages: ToastMessages<R>;
  action: () => Promise<ActionResult<R>>;
};

/**
 * A row button that confirms, runs a server action without fields in the one-toast flow
 * (CLAUDE.md "Forms") and refreshes the page on success, e.g. revoking a credential.
 */
export function ConfirmActionButton<R>({
  label,
  description,
  messages,
  action,
}: ConfirmActionButtonProps<R>) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, run } = useToastAction();
  const confirm = () =>
    run({
      action,
      messages,
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={label}
        description={description}
        confirmLabel={label}
        pending={pending}
        onConfirm={confirm}
      />
    </>
  );
}
