"use client";

import { Badge, Button } from "@bibi/ui";
import { UnlockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { deleteBlockAction } from "../actions";
import type { FloorBlock } from "../lib/floor-model";

export type BlockListProps = { blocks: readonly FloorBlock[]; canWrite: boolean };

/** The day's held-back tables, each with its period and a Release action. */
export function BlockList({ blocks, canWrite }: BlockListProps) {
  const t = useTranslations("reservation.block");
  const common = useTranslations("common");
  const router = useRouter();
  const [releasing, setReleasing] = useState<FloorBlock | null>(null);
  const { run, pending } = useToastAction();
  if (blocks.length === 0) return null;
  const release = () => {
    if (!releasing) return;
    run({
      action: () => deleteBlockAction({ id: releasing.id }),
      messages: { pending: common("saving"), success: t("released") },
      onSuccess: () => {
        setReleasing(null);
        router.refresh();
      },
    });
  };
  return (
    <section className="grid gap-2">
      <h2 className="text-lg">{t("listTitle")}</h2>
      <ul className="divide-y rounded-lg border">
        {blocks.map((block) => (
          <li
            key={block.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 text-sm"
          >
            <span className="font-medium">{t("table", { label: block.label })}</span>
            <Badge variant={block.kind === "BLOCK" ? "destructive" : "secondary"}>
              {t(`kinds.${block.kind}`)}
            </Badge>
            <span className="tabular-nums text-muted-foreground">{block.period}</span>
            {block.note ? <span>{block.note}</span> : null}
            {canWrite ? (
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setReleasing(block)}
              >
                <UnlockIcon />
                {t("release")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      <ConfirmDialog
        open={releasing !== null}
        onOpenChange={(open) => (open ? null : setReleasing(null))}
        title={t("releaseTitle", { label: releasing?.label ?? "" })}
        description={t("releaseDescription")}
        confirmLabel={t("release")}
        pending={pending}
        variant="default"
        onConfirm={release}
      />
    </section>
  );
}
