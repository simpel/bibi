import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { pipelineHref } from "@/features/pipeline/lib/pipeline-href";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { archiveBoardAction } from "../actions";

export type ArchiveBoardButtonProps = { board: { id: string; name: string } };

/** `board.archive`, then customize mode on the default board. The last board cannot go. */
export function ArchiveBoardButton({ board }: ArchiveBoardButtonProps) {
  const t = useTranslations("board");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { run, pending } = useToastAction();
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {t("archive")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("archive")}
        description={t("archiveConfirm", { name: board.name })}
        confirmLabel={t("archive")}
        pending={pending}
        onConfirm={() =>
          run({
            action: () => archiveBoardAction({ id: board.id }),
            messages: { pending: t("archiving"), success: t("archived") },
            onSuccess: () => {
              setOpen(false);
              router.push(pipelineHref({ customize: true }));
            },
          })
        }
      />
    </>
  );
}
