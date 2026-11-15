import type { SavedView } from "@bibi/core/schemas";
import { useTranslations } from "next-intl";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { saveSavedViewsAction } from "@/features/user-preference/saved-views-actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { removeView, type SavedViewListId } from "./lib/saved-views";
import type { SavedViewEntry } from "./saved-views-bar";

export type RemoveSavedViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listId: SavedViewListId;
  views: SavedView[];
  entry: SavedViewEntry;
};

/** Deletes a saved view, or removes a built-in one until the views are reset. */
export function RemoveSavedViewDialog({
  open,
  onOpenChange,
  listId,
  views,
  entry,
}: RemoveSavedViewDialogProps) {
  const t = useTranslations("common.savedViews");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const verb = entry.saved ? "delete" : "remove";
  const confirm = () =>
    run({
      action: () => saveSavedViewsAction({ listId, views: removeView({ views, key: entry.key }) }),
      messages: { pending: common("saving"), success: t(entry.saved ? "deleted" : "removed") },
      onSuccess: () => {
        onOpenChange(false);
        router.refresh();
      },
    });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t(verb, { name: entry.label })}
      description={t(`${verb}Description`, { name: entry.label })}
      confirmLabel={t(`${verb}Confirm`)}
      pending={pending}
      onConfirm={confirm}
    />
  );
}
