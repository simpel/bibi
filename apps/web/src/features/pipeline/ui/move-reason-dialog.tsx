import type { PipelineStatus } from "@bibi/core";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";

export type MoveReasonDialogProps = {
  /** The status that requires a reason; null = closed. */
  column: PipelineStatus | null;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
};

/** Asks for the reason a status with `requiresReason` needs before the card is moved. */
export function MoveReasonDialog({ column, onCancel, onSubmit }: MoveReasonDialogProps) {
  const t = useTranslations("pipeline.reason");
  const common = useTranslations("common");
  const [reason, setReason] = useState("");
  return (
    <Dialog open={column !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { column: column?.title ?? "" })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          aria-label={t("label")}
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {common("cancel")}
          </Button>
          <Button
            type="button"
            disabled={reason.trim() === ""}
            onClick={() => onSubmit(reason.trim())}
          >
            {t("confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
