"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import type { EditKind, EditValue } from "../../../lib/approval-edits";
import { useEditFieldForm } from "./use-edit-field-form";

/** The row being edited: its field label, how it is edited and its current value. */
export type EditTarget = { path: string; label: string; kind: EditKind; value: unknown };

export type EditFieldDialogProps = {
  target: EditTarget;
  onSave: (input: { path: string; value: EditValue }) => void;
  onClose: () => void;
};

/**
 * Edits one value of a proposal before the user confirms it. Nothing is sent: the value goes
 * into the card, and Confirm runs the proposal with it. Mount with `key` per row.
 */
export function EditFieldDialog({ target, onSave, onClose }: EditFieldDialogProps) {
  const t = useTranslations("assistant.approval.edit");
  const common = useTranslations("common");
  const form = useEditFieldForm({ kind: target.kind, value: target.value });
  const submit = form.handleSubmit((value) => {
    onSave({ path: target.path, value });
    onClose();
  });
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title", { field: target.label })}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} noValidate className="grid gap-4">
            {target.kind === "boolean" ? (
              <CheckField form={form} name="checked" label={target.label} />
            ) : (
              <TextField
                form={form}
                name="text"
                label={target.label}
                type={target.kind === "text" ? "text" : "number"}
                step={target.kind === "money" ? "0.01" : undefined}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {common("cancel")}
              </Button>
              <Button type="submit">{common("save")}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
