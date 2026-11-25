"use client";

import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveTaskDialog } from "./archive-task-dialog";

export type TaskDangerAreaProps = { task: { id: string; name: string } };

/** The task's danger area, last on its page: the only place it is archived (spec: danger-area). */
export function TaskDangerArea({ task }: TaskDangerAreaProps) {
  const t = useTranslations("task");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: task.name })}
      dialog={(state) => <ArchiveTaskDialog task={task} {...state} />}
    />
  );
}
