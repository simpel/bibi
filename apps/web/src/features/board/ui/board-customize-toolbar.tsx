import type { BoardDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { BoardAccess, ShareMember } from "@/features/pipeline/load-pipeline-data";
import { useRouter } from "@/lib/navigation";
import { ArchiveBoardButton } from "./archive-board-button";
import { BoardNameForm } from "./board-name-form";
import { BoardSwitcher } from "./board-switcher";
import { CreateBoardButton, ShareBoardButton } from "./board-view-buttons";
import { FormDialog } from "./form-dialog";

export type BoardCustomizeToolbarProps = {
  boards: readonly BoardDto[];
  boardId: string;
  access: BoardAccess;
  members: readonly ShareMember[];
  onDone: () => void;
};

/** Customize mode's toolbar: switch, rename, create, share and archive the view, and Done. */
export function BoardCustomizeToolbar({
  boards,
  boardId,
  access,
  members,
  onDone,
}: BoardCustomizeToolbarProps) {
  const t = useTranslations("board");
  const router = useRouter();
  const board = boards.find((candidate) => candidate.id === boardId);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardSwitcher boards={boards} boardId={boardId} customize />
      {board ? (
        <FormDialog label={t("rename")} title={t("rename")}>
          {({ close }) => (
            <BoardNameForm
              board={board}
              onDone={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </FormDialog>
      ) : null}
      <CreateBoardButton />
      {access.manage && board ? <ShareBoardButton board={board} members={members} /> : null}
      {access.manage && board ? <ArchiveBoardButton board={board} /> : null}
      <Button size="sm" className="ml-auto" onClick={onDone}>
        <CheckIcon aria-hidden />
        {t("done")}
      </Button>
    </div>
  );
}
