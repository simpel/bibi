"use client";

import { useRouter } from "@okazi/i18n/navigation";
import type { ActionResult } from "@/lib/action-result";
import type { ToastMessages } from "@/lib/submit-with-toast";
import { useToastAction } from "@/lib/use-toast-action";
import { ConfirmDialog } from "./confirm-dialog";

export type ConfirmActionDialogProps<R> = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Title and confirm button text, e.g. "Revoke". */
  label: string;
  description: string;
  messages: ToastMessages<R>;
  action: () => Promise<ActionResult<R>>;
};

/**
 * Confirms, runs a server action without fields in the one-toast flow (CLAUDE.md "Forms") and
 * refreshes the page on success. Opened from a button or a row actions menu item.
 */
export function ConfirmActionDialog<R>({
  open,
  onOpenChange,
  label,
  description,
  messages,
  action,
}: ConfirmActionDialogProps<R>) {
  const router = useRouter();
  const { pending, run } = useToastAction();
  const confirm = () =>
    run({
      action,
      messages,
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={label}
      description={description}
      confirmLabel={label}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
