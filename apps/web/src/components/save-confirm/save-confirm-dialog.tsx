"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { SaveChange } from "./save-confirm-context";

export type SaveConfirmDialogProps = {
  /** The change to confirm; null = closed. */
  changes: SaveChange[] | null;
  onConfirm: () => void;
  onCancel: () => void;
};

/** "Confirm change": each field before (struck through) and after. The outcome is a toast. */
export function SaveConfirmDialog({ changes, onConfirm, onCancel }: SaveConfirmDialogProps) {
  const t = useTranslations("common.saveConfirm");
  const common = useTranslations("common");
  return (
    <Dialog open={changes !== null} onOpenChange={(open) => (open ? null : onCancel())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div data-slot="save-confirm-changes" className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("field")}</TableHead>
                <TableHead>{t("before")}</TableHead>
                <TableHead>{t("after")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(changes ?? []).map((change) => (
                <TableRow key={change.field}>
                  <TableCell>{change.field}</TableCell>
                  <TableCell className="text-muted-foreground line-through">
                    {change.before}
                  </TableCell>
                  <TableCell className="font-medium">{change.after}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
