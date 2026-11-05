import type { PipelineStatus } from "@bibi/core";
import type { TransitionGate } from "@bibi/core/schemas";
import {
  Button,
  ColorSwatch,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useFormatter, useTranslations } from "next-intl";

export type StatusPick = {
  /** The column the card was dropped on. */
  column: { title: string };
  /** The statuses of that column the card may move to. */
  targets: readonly PipelineStatus[];
  /** The gates of the move from the card's current status, by target id. */
  gates: Readonly<Record<string, readonly TransitionGate[]>>;
};

export type MoveStatusPickerDialogProps = {
  /** What to pick from; null = closed. */
  pick: StatusPick | null;
  onPick: (status: PipelineStatus) => void;
  onCancel: () => void;
};

type NeedsProps = { gates: readonly TransitionGate[] };

/** The requirements of one move in plain words ("Needs a reason and a main assignee"). */
function Needs({ gates }: NeedsProps) {
  const t = useTranslations("pipeline.picker");
  const format = useFormatter();
  if (gates.length === 0) return <>{t("noRequirements")}</>;
  const list = format.list(gates.map((gate) => t(`gate.${gate}`)));
  return <>{t("needs", { list })}</>;
}

/** Dropping on a column with several statuses: pick the status the order moves to (ADR 0076). */
export function MoveStatusPickerDialog({ pick, onPick, onCancel }: MoveStatusPickerDialogProps) {
  const t = useTranslations("pipeline.picker");
  const common = useTranslations("common");
  return (
    <Dialog open={pick !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { column: pick?.column.title ?? "" })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ul className="grid gap-2">
          {(pick?.targets ?? []).map((status) => (
            <li key={status.id}>
              <Button
                type="button"
                variant="outline"
                className="h-auto w-full justify-start gap-3 py-2 text-left"
                onClick={() => onPick(status)}
              >
                <ColorSwatch color={status.color} />
                <span className="grid">
                  <span className="font-medium">{status.title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    <Needs gates={pick?.gates[status.id] ?? []} />
                  </span>
                </span>
              </Button>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {common("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
