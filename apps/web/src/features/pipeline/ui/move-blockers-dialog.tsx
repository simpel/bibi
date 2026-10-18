import type { AppErrorIssue } from "@okazi/core";
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

export type MoveBlockersDialogProps = {
  /** The blockers of a refused move; null = closed. */
  issues: readonly AppErrorIssue[] | null;
  /** The target phase name. */
  title: string;
  onClose: () => void;
};

/** Lists everything that blocks a move (`ticket.changePhase` CONFLICT issues). */
export function MoveBlockersDialog({ issues, title, onClose }: MoveBlockersDialogProps) {
  const t = useTranslations("pipeline.blockers");
  return (
    <Dialog open={issues !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("title", { column: title })}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <ul className="grid list-disc gap-1 pl-5 text-sm">
          {(issues ?? []).map((issue) => (
            <li key={`${issue.path}:${issue.message}`}>{issue.message}</li>
          ))}
        </ul>
        <DialogFooter>
          <Button type="button" onClick={onClose}>
            {t("close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
