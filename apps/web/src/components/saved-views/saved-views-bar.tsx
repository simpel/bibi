"use client";

import type { SavedView } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { BookmarkPlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/lib/navigation";
import type { SavedViewListId } from "./lib/saved-views";
import { RemoveSavedViewDialog } from "./remove-saved-view-dialog";
import { SavedViewNameDialog } from "./saved-view-name-dialog";
import { SavedViewsMenu } from "./saved-views-menu";

export type SavedViewEntry = {
  key: string;
  label: string;
  href: { pathname: string; query: Record<string, string> };
  active: boolean;
  /** Saved by the member (renamable); built-in views can only be removed. */
  saved: boolean;
};

export type SavedViewsBarProps = {
  listId: SavedViewListId;
  /** The stored list the changes are made to. */
  views: SavedView[];
  entries: SavedViewEntry[];
  /** The search in effect when no view matches it, to save as one. */
  unsavedQuery: string | null;
};

export type SavedViewsDialog = "save" | "rename" | "remove" | null;

/** The view pills, a Save view button for an unsaved search and the views menu. */
export function SavedViewsBar({ listId, views, entries, unsavedQuery }: SavedViewsBarProps) {
  const t = useTranslations("common.savedViews");
  const [dialog, setDialog] = useState<SavedViewsDialog>(null);
  const active = entries.find((entry) => entry.active);
  // The dialogs are controlled: they only ever ask to close.
  const onOpenChange = () => setDialog(null);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {entries.length > 0 ? (
        <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
          {entries.map((entry) => (
            <Button
              key={entry.key}
              asChild
              size="sm"
              variant={entry.active ? "secondary" : "ghost"}
            >
              <Link href={entry.href} aria-pressed={entry.active}>
                {entry.label}
              </Link>
            </Button>
          ))}
        </nav>
      ) : null}
      {unsavedQuery ? (
        <Button size="sm" variant="ghost" onClick={() => setDialog("save")}>
          <BookmarkPlusIcon aria-hidden />
          {t("save")}
        </Button>
      ) : null}
      <SavedViewsMenu
        listId={listId}
        active={active}
        canSave={unsavedQuery !== null}
        onOpen={setDialog}
      />
      {unsavedQuery ? (
        <SavedViewNameDialog
          mode="save"
          open={dialog === "save"}
          onOpenChange={onOpenChange}
          listId={listId}
          views={views}
          query={unsavedQuery}
        />
      ) : null}
      {active?.saved ? (
        <SavedViewNameDialog
          mode="rename"
          open={dialog === "rename"}
          onOpenChange={onOpenChange}
          listId={listId}
          views={views}
          viewKey={active.key}
          name={active.label}
        />
      ) : null}
      {active ? (
        <RemoveSavedViewDialog
          open={dialog === "remove"}
          onOpenChange={onOpenChange}
          listId={listId}
          views={views}
          entry={active}
        />
      ) : null}
    </div>
  );
}
