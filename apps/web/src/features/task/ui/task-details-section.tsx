import { getItem, listOrders, type TaskDto } from "@bibi/core";
import { Alert, AlertDescription, AlertTitle } from "@bibi/ui";
import { TriangleAlertIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EditableSection } from "@/components/inline-edit/editable-section";
import { Link } from "@/lib/navigation";
import { itemRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { runOperation } from "@/server/run-operation";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";
import { TaskLinkOrder } from "./task-link-order";

export type TaskDetailsSectionProps = {
  task: TaskDto;
  canEdit: boolean;
  formData: Promise<TaskFormData | null>;
};

/** The customer's active orders a task may be added to, while it has none. */
async function linkableOrders({ task }: { task: TaskDto }) {
  const abilities = await getCallerAbilities();
  if (task.orderId || !can({ abilities, permission: "order:read" })) return [];
  const result = await runOperation({
    operation: listOrders,
    input: { customerId: task.customerId, limit: 50 },
  });
  if (!result.ok) return [];
  return result.value.items.map((order) => ({
    id: order.id,
    name: `#${order.reference} ${order.title ?? ""}`.trim(),
  }));
}

/** The item the task names (with its busy warning), the note and Add to order. */
export async function TaskDetailsSection({ task, canEdit, formData }: TaskDetailsSectionProps) {
  const [t, dates, item, orders] = await Promise.all([
    getTranslations("task"),
    getDateTimeFormat(),
    task.itemId ? runOperation({ operation: getItem, input: { id: task.itemId } }) : null,
    linkableOrders({ task }),
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
        title={t("details")}
        editLabel={t("inlineEdit.details")}
        canEdit={canEdit}
        editor={<TaskInlineEditor task={task} data={formData} groups={["item", "note"]} />}
      >
        <dl className="grid gap-4 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-muted-foreground">{t("fields.item")}</dt>
          <dd>
            {task.itemId && itemName ? (
              <Link href={itemRoute({ id: task.itemId })}>{itemName}</Link>
            ) : (
              t("fields.noItem")
            )}
          </dd>
          <dt className="text-muted-foreground">{t("fields.note")}</dt>
          <dd className="whitespace-pre-line">{task.note ?? t("noNote")}</dd>
        </dl>
      </EditableSection>
      {canEdit && orders.length > 0 ? <TaskLinkOrder taskId={task.id} orders={orders} /> : null}
    </div>
  );
}
