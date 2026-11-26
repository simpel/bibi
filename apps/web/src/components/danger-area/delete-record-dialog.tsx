"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";

export type DeleteRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The record's name: the words to type before Delete permanently is enabled. */
  name: string;
  pending: boolean;
  onConfirm: () => void;
};

/**
 * Permanent delete of an archived record, confirmed by typing its name (spec: danger-area,
 * ADR 0118). The outcome is a toast; the caller closes the dialog on success.
 */
export function DeleteRecordDialog({
  open,
  onOpenChange,
  name,
  pending,
  onConfirm,
}: DeleteRecordDialogProps) {
  const t = useTranslations("common.lifecycle");
  const common = useTranslations("common");
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name.trim();
  const close = () => {
    setTyped("");
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("delete")}</DialogTitle>
          <DialogDescription>{t("deleteConfirm", { name })}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Label htmlFor={inputId}>{t("typeName", { name })}</Label>
          <Input
            id={inputId}
            value={typed}
            autoComplete="off"
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {common("cancel")}
          </Button>
          <Button variant="destructive" disabled={pending || !matches} onClick={onConfirm}>
            {t("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
