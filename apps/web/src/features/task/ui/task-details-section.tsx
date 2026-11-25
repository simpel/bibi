import { getItem, type TaskDto } from "@bibi/core";
import { Alert, AlertDescription, AlertTitle } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { Link } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";

export type TaskDetailsSectionProps = {
  task: TaskDto;
  canEdit: boolean;
  formData: Promise<TaskFormData | null>;
};

/** The note up front, then the item the task names with its busy warning. */
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
      <EditableSection
        title={t("fields.note")}
        editLabel={t("inlineEdit.note")}
        canEdit={canEdit}
        editor={<TaskInlineEditor task={task} data={formData} groups={["note"]} />}
      >
        <p className={task.note ? "whitespace-pre-line text-base" : "text-muted-foreground"}>
          {task.note ?? t("noNote")}
        </p>
      </EditableSection>
      <EditableSection
        title={t("fields.item")}
        editLabel={t("inlineEdit.item")}
        canEdit={canEdit}
        editor={<TaskInlineEditor task={task} data={formData} groups={["item"]} />}
      >
        <p className="text-sm">
          {task.itemId && itemName ? (
            <Link href={itemRoute({ id: task.itemId })}>{itemName}</Link>
          ) : (
            t("fields.noItem")
          )}
        </p>
      </EditableSection>
    </div>
  );
}
