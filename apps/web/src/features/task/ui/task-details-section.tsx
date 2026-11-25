import { getItem, type TaskDto } from "@bibi/core";
import { Alert, AlertDescription, AlertTitle } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { itemRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";
import { TaskRelatedList } from "./task-related-list";

export type TaskDetailsSectionProps = {
  task: TaskDto;
  canEdit: boolean;
  formData: Promise<TaskFormData | null>;
};

/** The note up front and big, the rooms and items it is about in a side column. */
export async function TaskDetailsSection({ task, canEdit, formData }: TaskDetailsSectionProps) {
  const [t, dates, item] = await Promise.all([
    getTranslations("task"),
    getDateTimeFormat(),
    task.itemId ? runOperation({ operation: getItem, input: { id: task.itemId } }) : null,
  ]);
  const itemName = item?.ok ? item.value.name : null;
  const busy = task.warnings.find((warning) => warning.kind === "ITEM_BUSY");
  return (
    <div className="grid gap-6">
      {busy ? (
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>{t("busy.title", { item: itemName ?? t("busy.theItem") })}</AlertTitle>
          <AlertDescription>
            {t("busy.description", {
              when: dates.dateTimeRange({ start: busy.startsAt, end: busy.endsAt }),
            })}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_16rem]">
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
        <TaskRelatedList
          taskId={task.id}
          items={
            task.itemId && itemName
              ? [{ id: task.itemId, name: itemName, href: itemRoute({ id: task.itemId }) }]
              : []
          }
          canEdit={canEdit}
          editor={<TaskInlineEditor task={task} data={formData} groups={["item"]} />}
        />
      </div>
    </div>
  );
}
