"use client";

import type { BoardDto } from "@bibi/core/schemas";
import { PlusIcon, UsersIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import type { ShareMember } from "@/features/pipeline/load-pipeline-data";
import { useRouter } from "@/lib/navigation";
import { BoardNameForm } from "./board-name-form";
import { FormDialog } from "./form-dialog";
import { FormPopover } from "./form-popover";
import { ShareBoardForm } from "./share-board-form";

/** Create a view (ADR 0111): anyone may; it opens in customize mode, private until shared. */
export function CreateBoardButton() {
  const t = useTranslations("board");
  const router = useRouter();
  return (
    <FormDialog label={t("create")} title={t("create")} icon={<PlusIcon aria-hidden />}>
      {({ close }) => (
        <BoardNameForm
          onDone={({ value }) => {
            close();
            router.push(pipelineHref({ boardId: value.id, customize: true }));
          }}
        />
      )}
    </FormDialog>
  );
}

export type ShareBoardButtonProps = { board: BoardDto; members: readonly ShareMember[] };

/** Who sees and edits the view (`board.share`); only its owner or a manager has the button. */
export function ShareBoardButton({ board, members }: ShareBoardButtonProps) {
  const t = useTranslations("board.share");
  const router = useRouter();
  return (
    <FormPopover label={t("button")} title={t("title")} icon={<UsersIcon aria-hidden />}>
      {() => <ShareBoardForm board={board} members={members} onSaved={() => router.refresh()} />}
    </FormPopover>
  );
}
