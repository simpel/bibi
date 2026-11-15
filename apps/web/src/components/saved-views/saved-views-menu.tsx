import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bibi/ui";
import { BookmarkPlusIcon, EllipsisIcon, PencilIcon, RotateCcwIcon, TrashIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { saveSavedViewsAction } from "@/features/user-preference/saved-views-actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import type { SavedViewListId } from "./lib/saved-views";
import type { SavedViewEntry, SavedViewsDialog } from "./saved-views-bar";

export type SavedViewsMenuProps = {
  listId: SavedViewListId;
  /** The lit view, which Rename and Remove act on. */
  active: SavedViewEntry | undefined;
  canSave: boolean;
  onOpen: (dialog: SavedViewsDialog) => void;
};

/** Save the current search, rename or remove the lit view, or put back the built-in views. */
export function SavedViewsMenu({ listId, active, canSave, onOpen }: SavedViewsMenuProps) {
  const t = useTranslations("common.savedViews");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const reset = () =>
    run({
      action: () => saveSavedViewsAction({ listId, views: null }),
      messages: { pending: common("saving"), success: t("resetDone") },
      onSuccess: () => router.refresh(),
    });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label={t("options")}
          disabled={pending}
        >
          <EllipsisIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {canSave ? (
          <DropdownMenuItem onSelect={() => onOpen("save")}>
            <BookmarkPlusIcon aria-hidden />
            {t("save")}
          </DropdownMenuItem>
        ) : null}
        {active?.saved ? (
          <DropdownMenuItem onSelect={() => onOpen("rename")}>
            <PencilIcon aria-hidden />
            {t("rename", { name: active.label })}
          </DropdownMenuItem>
        ) : null}
        {active ? (
          <DropdownMenuItem destructive onSelect={() => onOpen("remove")}>
            <TrashIcon aria-hidden />
            {t(active.saved ? "delete" : "remove", { name: active.label })}
          </DropdownMenuItem>
        ) : null}
        {canSave || active ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onSelect={reset}>
          <RotateCcwIcon aria-hidden />
          {t("reset")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
