"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@okazi/ui";
import { useTranslations } from "next-intl";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
};

/**
 * Destructive confirmation (archive). The outcome is a toast (CLAUDE.md "Forms"); the dialog
 * stays open while `pending` and the caller closes it on success.
 */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button variant="destructive" disabled={props.pending} onClick={props.onConfirm}>
            {props.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
