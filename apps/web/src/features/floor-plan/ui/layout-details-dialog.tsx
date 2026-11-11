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
  Textarea,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type FormEvent, useId } from "react";
import type { LayoutFacts } from "../lib/layout-facts";

export type LayoutDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facts: LayoutFacts;
  /** The seats drawn, as the hint for an empty capacity. */
  seats: number;
  /** The room's people limit, if any. */
  maxPeople: number | null;
  onConfirm: (facts: LayoutFacts) => void;
};

const minutes = ({ data, key }: { data: FormData; key: string }) => {
  const raw = String(data.get(key) ?? "").trim();
  return raw === "" ? null : Math.max(0, Math.min(1440, Math.round(Number(raw)) || 0));
};

/**
 * The layout's name, what it suits, typed capacity and setup and teardown minutes. Like the
 * drawing, they change in the editor only; Save stores them.
 */
export function LayoutDetailsDialog({
  open,
  onOpenChange,
  facts,
  seats,
  maxPeople,
  onConfirm,
}: LayoutDetailsDialogProps) {
  const t = useTranslations("floorPlan.detailsDialog");
  const common = useTranslations("common");
  const id = useId();
  const submit = ({ event }: { event: FormEvent<HTMLFormElement> }) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const capacity = minutes({ data, key: "capacity" });
    if (!name) return;
    onConfirm({
      name: name.slice(0, 80),
      description: String(data.get("description") ?? "").trim() || null,
      capacity: capacity === 0 ? null : capacity,
      setupMinutes: minutes({ data, key: "setupMinutes" }),
      teardownMinutes: minutes({ data, key: "teardownMinutes" }),
    });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(event) => submit({ event })} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-name`}>{t("name")}</Label>
            <Input
              id={`${id}-name`}
              name="name"
              defaultValue={facts.name}
              maxLength={80}
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-description`}>{t("suits")}</Label>
            <Textarea
              id={`${id}-description`}
              name="description"
              rows={2}
              maxLength={2000}
              defaultValue={facts.description ?? ""}
              placeholder={t("suitsPlaceholder")}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${id}-capacity`}>{t("capacity")}</Label>
            <Input
              id={`${id}-capacity`}
              name="capacity"
              type="number"
              min={1}
              max={maxPeople ?? 100_000}
              defaultValue={facts.capacity ?? ""}
              placeholder={t("capacityPlaceholder", { seats })}
            />
            <p className="text-xs text-muted-foreground">
              {maxPeople === null ? t("capacityHint") : t("capacityLimit", { max: maxPeople })}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-setupMinutes`}>{t("setupMinutes")}</Label>
              <Input
                id={`${id}-setupMinutes`}
                name="setupMinutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={facts.setupMinutes ?? ""}
                placeholder={t("roomsOwn")}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${id}-teardownMinutes`}>{t("teardownMinutes")}</Label>
              <Input
                id={`${id}-teardownMinutes`}
                name="teardownMinutes"
                type="number"
                min={0}
                max={1440}
                defaultValue={facts.teardownMinutes ?? ""}
                placeholder={t("roomsOwn")}
              />
            </div>
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
