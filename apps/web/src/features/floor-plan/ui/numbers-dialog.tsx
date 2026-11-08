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
import { type FormEvent, useId } from "react";

export type NumberField = { key: string; label: string; value: number; min: number; max: number };

export type NumbersDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  fields: readonly NumberField[];
  onConfirm: (values: Record<string, number>) => void;
};

/**
 * One or two numbers for the open drawing (a typed capacity, the room's size). They change the
 * drawing only; the page's Save stores them with the rest.
 */
export function NumbersDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  fields,
  onConfirm,
}: NumbersDialogProps) {
  const t = useTranslations("common");
  const id = useId();
  const submit = ({ event }: { event: FormEvent<HTMLFormElement> }) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      fields.map((field) => {
        const value = Math.round(Number(data.get(field.key)));
        return [
          field.key,
          Math.min(field.max, Math.max(field.min, Number.isFinite(value) ? value : field.value)),
        ];
      }),
    );
    onConfirm(values);
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => submit({ event })} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.key} className="grid gap-1.5">
                <Label htmlFor={`${id}-${field.key}`}>{field.label}</Label>
                <Input
                  id={`${id}-${field.key}`}
                  name={field.key}
                  type="number"
                  min={field.min}
                  max={field.max}
                  defaultValue={field.value}
                  required
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit">{confirmLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
