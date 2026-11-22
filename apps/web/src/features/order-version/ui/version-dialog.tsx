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
import { lastValue } from "@/lib/live-query-state";
import { useRouter } from "@/lib/navigation";
import { useLiveQuery } from "@/lib/use-live-query";
import { useToastAction } from "@/lib/use-toast-action";
import { loadVersionAction, restoreVersionAction } from "../actions";
import { VersionChangesList } from "./version-changes";

export type VersionDialogProps = {
  versionId: string;
  /** The dialog's title, e.g. "Version 4" or "Restore quote version 2". */
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `program:write`: the Restore button shows. */
  canRestore: boolean;
};

/**
 * A version's changes against the order now, read when the dialog opens, with Restore (ADR
 * 0116): the dialog is the confirmation, since it lists exactly what the restore undoes.
 */
export function VersionDialog({
  versionId,
  title,
  open,
  onOpenChange,
  canRestore,
}: VersionDialogProps) {
  const t = useTranslations("orderVersion");
  const common = useTranslations("common");
  const router = useRouter();
  const live = useLiveQuery({ input: open ? { id: versionId } : null, load: loadVersionAction });
  const detail = lastValue({ state: live });
  const { pending, run } = useToastAction();
  const restore = () =>
    run({
      action: () => restoreVersionAction({ id: versionId }),
      messages: { pending: common("saving"), success: t("restored") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  const changed = (detail?.changes.count ?? 0) > 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("dialogDescription")}</DialogDescription>
        </DialogHeader>
        {live.status === "error" ? (
          <p className="text-sm text-destructive">{t("loadFailed")}</p>
        ) : detail ? (
          <VersionChangesList changes={detail.changes} />
        ) : (
          <p className="text-sm text-muted-foreground">{common("loading")}</p>
        )}
        {canRestore && changed ? (
          <p className="text-xs text-muted-foreground">{t("restoreNote")}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {common("cancel")}
          </Button>
          {canRestore ? (
            <Button type="button" disabled={pending || !changed} onClick={restore}>
              {t("restore")}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
