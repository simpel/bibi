import type { BoardDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import type { BoardAccess } from "@/features/pipeline/load-pipeline-data";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { reorderBoardsAction } from "../actions";
import { ArchiveBoardButton } from "./archive-board-button";
import { BoardNameForm } from "./board-name-form";
import { BoardSwitcher } from "./board-switcher";
import { FormPopover } from "./form-popover";

export type BoardCustomizeToolbarProps = {
  boards: readonly BoardDto[];
  boardId: string;
  access: BoardAccess;
  onDone: () => void;
};

type NameButtonsProps = { board: BoardDto | undefined };

/** Rename this board, or name a new one and customize it. */
function BoardNameButtons({ board }: NameButtonsProps) {
  const t = useTranslations("board");
  const router = useRouter();
  return (
    <>
      {board ? (
        <FormPopover label={t("rename")} title={t("rename")}>
          {({ close }) => (
            <BoardNameForm
              board={board}
              onDone={() => {
                close();
                router.refresh();
              }}
            />
          )}
        </FormPopover>
      ) : null}
      <FormPopover label={t("create")} title={t("create")} icon={<PlusIcon aria-hidden />}>
        {({ close }) => (
          <BoardNameForm
            onDone={({ value }) => {
              close();
              router.push(pipelineHref({ boardId: value.id, customize: true }));
            }}
          />
        )}
      </FormPopover>
    </>
  );
}

/** Customize mode's toolbar: switch, rename, new, default and archive board, and Done. */
export function BoardCustomizeToolbar({
  boards,
  boardId,
  access,
  onDone,
}: BoardCustomizeToolbarProps) {
  const t = useTranslations("board");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const board = boards.find((candidate) => candidate.id === boardId) ?? boards[0];
  const ids = boards.map((candidate) => candidate.id);
  const makeDefault = () =>
    run({
      action: () => reorderBoardsAction({ ids: [boardId, ...ids.filter((id) => id !== boardId)] }),
      messages: { pending: t("saving"), success: t("madeDefault") },
      onSuccess: () => router.refresh(),
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <BoardSwitcher boards={boards} boardId={boardId} customize />
      <BoardNameButtons board={board} />
      {ids[0] !== boardId ? (
        <Button variant="outline" size="sm" disabled={pending} onClick={makeDefault}>
          {t("makeDefault")}
        </Button>
      ) : null}
      {access.remove && board && boards.length > 1 ? <ArchiveBoardButton board={board} /> : null}
      <Button size="sm" className="ml-auto" onClick={onDone}>
        <CheckIcon aria-hidden />
        {t("done")}
      </Button>
    </div>
  );
}
