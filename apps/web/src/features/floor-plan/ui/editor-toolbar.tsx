import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bibi/ui";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type LayoutTab, LayoutTabs } from "./layout-tabs";
import type { EditorSave } from "./use-editor-save";
import type { LayoutDraft } from "./use-layout-draft";

export type EditorToolbarProps = {
  itemId: string;
  tab: string;
  tabs: readonly LayoutTab[];
  dirty: boolean;
  canEdit: boolean;
  save: EditorSave;
  draft: LayoutDraft;
};

/** One row under the top bar: the tabs left, undo, redo and Save right. */
export function EditorToolbar({
  itemId,
  tab,
  tabs,
  dirty,
  canEdit,
  save,
  draft,
}: EditorToolbarProps) {
  const t = useTranslations("floorPlan");
  const common = useTranslations("common");
  const { state, dispatch } = draft;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2">
      <LayoutTabs itemId={itemId} tabs={tabs} current={tab} dirty={dirty} />
      {canEdit ? (
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("undo")}
                disabled={state.undo.length === 0}
                onClick={() => dispatch({ type: "undo" })}
              >
                <Undo2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("undo")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t("redo")}
                disabled={state.redo.length === 0}
                onClick={() => dispatch({ type: "redo" })}
              >
                <Redo2Icon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("redo")}</TooltipContent>
          </Tooltip>
          <Button disabled={!dirty || save.pending} onClick={save.save}>
            {dirty ? common("save") : t("savedState")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
