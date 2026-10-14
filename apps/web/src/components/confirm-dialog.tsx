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
import type { ErrorKey } from "@/lib/error-key";
import { ErrorBanner } from "./states/error-banner";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  errorKey: ErrorKey | null;
  onConfirm: () => void;
};

/** Destructive confirmation (archive). Stays open and shows the error when the action fails. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{props.title}</DialogTitle>
          <DialogDescription>{props.description}</DialogDescription>
        </DialogHeader>
        <ErrorBanner errorKey={props.errorKey} />
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
