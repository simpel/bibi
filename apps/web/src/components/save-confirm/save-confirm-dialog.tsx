"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { SaveChange } from "./save-confirm-context";

export type SaveConfirmDialogProps = {
  /** The change to confirm; null = closed. */
  changes: SaveChange[] | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/** A field label inside a sentence: "Time zone" → "time zone", an acronym ("SIE") as it is. */
function inSentence({ label }: { label: string }): string {
  const [first = "", second = ""] = label;
  return second === second.toLowerCase() ? first.toLowerCase() + label.slice(1) : label;
}

/** "You're changing time zone to **Europe/London**.", one line per field. The outcome is a toast. */
export function SaveConfirmDialog({ changes, onConfirm, onCancel }: SaveConfirmDialogProps) {
  const t = useTranslations("common.saveConfirm");
  const common = useTranslations("common");
  return (
    <Dialog open={changes !== null} onOpenChange={(open) => (open ? null : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          {(changes ?? []).map((change) => (
            <DialogDescription key={change.field}>
              {t.rich("line", {
                field: inSentence({ label: change.field }),
                value: change.value,
                b: (chunks) => <strong className="font-medium text-foreground">{chunks}</strong>,
              })}
            </DialogDescription>
          ))}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {common("cancel")}
          </Button>
          <Button onClick={onConfirm}>{common("confirm")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
