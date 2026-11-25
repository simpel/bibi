"use client";

import { Button, DangerZone, DangerZoneRow } from "@bibi/ui";
import { ArchiveIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveTaskDialog } from "./archive-task-dialog";

export type TaskDangerAreaProps = { task: { id: string; name: string } };

/** The task's danger area, last on its page: the only place it is archived (spec: danger-area). */
export function TaskDangerArea({ task }: TaskDangerAreaProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <DangerZone title={common("dangerArea")}>
      <DangerZoneRow
        title={t("archive")}
        description={t("archiveConfirm", { name: task.name })}
        action={
          <Button variant="outline" className="text-destructive" onClick={() => setArchiving(true)}>
            <ArchiveIcon aria-hidden />
            {t("archive")}
          </Button>
        }
      />
      <ArchiveTaskDialog task={task} open={archiving} onOpenChange={setArchiving} />
    </DangerZone>
  );
}
