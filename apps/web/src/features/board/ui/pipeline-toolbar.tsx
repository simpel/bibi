import type { BoardDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import { BoardSwitcher } from "./board-switcher";

export type PipelineToolbarProps = {
  boards: readonly Pick<BoardDto, "id" | "name">[];
  boardId: string | null;
  /** `board:write`: the Configure button turns the board into customize mode. */
  canConfigure: boolean;
  /** The board totals, shown next to the switcher. */
  totals?: ReactNode;
};

/** Above the board: the board switcher and, for those who may edit boards, Configure. */
export function PipelineToolbar({ boards, boardId, canConfigure, totals }: PipelineToolbarProps) {
  const t = useTranslations("board");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardSwitcher boards={boards} boardId={boardId} />
      {totals}
      {canConfigure && boardId ? (
        <Button asChild variant="outline" className="ml-auto">
          <Link href={pipelineHref({ boardId, customize: true })}>
            <Settings2Icon aria-hidden />
            {t("configure")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
