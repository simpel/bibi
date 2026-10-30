import type { BoardDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { Settings2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { Link } from "@/lib/navigation";
import { BoardSwitcher } from "./board-switcher";

export type PipelineToolbarProps = {
  boards: readonly Pick<BoardDto, "id" | "name">[];
  boardId: string | null;
  /** `pipeline:write`: the Configure button turns the board into customize mode. */
  canConfigure: boolean;
};

/** Above the board: the board switcher and, for those who may edit boards, Configure. */
export function PipelineToolbar({ boards, boardId, canConfigure }: PipelineToolbarProps) {
  const t = useTranslations("board");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardSwitcher boards={boards} boardId={boardId} />
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
