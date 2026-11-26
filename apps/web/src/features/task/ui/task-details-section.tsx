import type { TaskDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { loadTaskRooms } from "../load-task-rooms";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";
import { TaskRooms } from "./task-rooms";

export type TaskDetailsSectionProps = {
  task: TaskDto;
  canEdit: boolean;
  formData: Promise<TaskFormData | null>;
  /** The task's facts, first in the side column above Rooms. */
  facts?: ReactNode;
  /** The danger area, last in the main column under the note. */
  dangerArea?: ReactNode;
};

/** The note up front and big, the facts and the rooms it concerns in a side column. */
export async function TaskDetailsSection({
  task,
  canEdit,
  formData,
  facts,
  dangerArea,
}: TaskDetailsSectionProps) {
  const [t, rooms] = await Promise.all([getTranslations("task"), loadTaskRooms({ task })]);
  return (
    <div className="grid gap-6">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="grid content-start gap-10">
          <EditableSection
            title={t("fields.note")}
            titleHidden
            editLabel={t("inlineEdit.note")}
            canEdit={canEdit}
            editor={<TaskInlineEditor task={task} data={formData} groups={["note"]} />}
          >
            <p
              className={
                task.note
                  ? "whitespace-pre-line text-2xl leading-snug text-pretty"
                  : "text-muted-foreground"
              }
            >
              {task.note ?? t("noNote")}
            </p>
          </EditableSection>
          {dangerArea}
        </div>
        <div className="grid content-start gap-8">
          {facts}
          <TaskRooms
            taskId={task.id}
            rooms={rooms}
            canEdit={canEdit}
            dueAt={task.dueAt}
            data={formData}
          />
        </div>
      </div>
    </div>
  );
}
