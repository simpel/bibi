import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type FormEvent, useId } from "react";

export type NameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  onConfirm: (name: string) => void;
};

/** The layout's name. Like the capacity, it changes the drawing only; Save stores it. */
export function NameDialog({ open, onOpenChange, name, onConfirm }: NameDialogProps) {
  const t = useTranslations("floorPlan.renameDialog");
  const common = useTranslations("common");
  const id = useId();
  const submit = ({ event }: { event: FormEvent<HTMLFormElement> }) => {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("name") ?? "").trim();
    if (value) onConfirm(value.slice(0, 80));
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => submit({ event })} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={id}>{t("field")}</Label>
            <Input id={id} name="name" defaultValue={name} maxLength={80} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {common("cancel")}
            </Button>
            <Button type="submit">{t("confirm")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
