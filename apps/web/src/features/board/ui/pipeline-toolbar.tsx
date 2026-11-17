import type { BoardDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import type { BoardAccess, ShareMember } from "@/features/pipeline/load-pipeline-data";
import { Link } from "@/lib/navigation";
import { BoardSwitcher } from "./board-switcher";
import { CreateBoardButton, ShareBoardButton } from "./board-view-buttons";

export type PipelineToolbarProps = {
  boards: readonly BoardDto[];
  boardId: string | null;
  access: Pick<BoardAccess, "write" | "manage">;
  members: readonly ShareMember[];
  /** The board totals, shown next to the switcher. */
  totals?: ReactNode;
};

/**
 * Above the board: the view switcher, Create view for everyone, and for the view shown Share
 * (its owner or a manager) and Configure (whoever may edit it, ADR 0111).
 */
export function PipelineToolbar({
  boards,
  boardId,
  access,
  members,
  totals,
}: PipelineToolbarProps) {
  const t = useTranslations("board");
  const board = boards.find(({ id }) => id === boardId);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardSwitcher boards={boards} boardId={boardId} />
      {totals}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <CreateBoardButton />
        {access.manage && board ? <ShareBoardButton board={board} members={members} /> : null}
        {access.write && boardId ? (
          <Button asChild variant="outline" size="sm">
            <Link href={pipelineHref({ boardId, customize: true })}>
              <Settings2Icon aria-hidden />
              {t("configure")}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
