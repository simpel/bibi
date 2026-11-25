import type { TaskDto } from "@bibi/core";
import { type KeyFact, KeyFacts } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { Link } from "@/lib/navigation";
import { customerRoute, orderRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { TaskEditGroup } from "./task-edit-groups";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";

const EMPTY = "–";

/** Names the facts show, read by the page by id (ADR 0097). */
export type TaskFactNames = {
  customer: string | null;
  contact: string | null;
  assignee: string | null;
  /** `#12 Title` of the linked order. */
  order: string | null;
};

export type TaskKeyFactsProps = {
  task: TaskDto;
  names: TaskFactNames;
  canEdit: boolean;
  formData: Promise<TaskFormData | null>;
};

/** When, customer, contact, assignee and order under the title; each editable fact in place. */
export async function TaskKeyFacts({ task, names, canEdit, formData }: TaskKeyFactsProps) {
  const [t, edit, dates] = await Promise.all([
    getTranslations("task.fields"),
    getTranslations("task.inlineEdit"),
    getDateTimeFormat(),
  ]);
  const editable = ({ group, node }: { group: TaskEditGroup; node: ReactNode }) => (
    <EditableFact
      editLabel={edit(group)}
      canEdit={canEdit}
      editor={<TaskInlineEditor task={task} data={formData} groups={[group]} />}
    >
      {node}
    </EditableFact>
  );
  const when = task.endsAt
    ? dates.timeRange({ start: task.startsAt, end: task.endsAt })
    : dates.time({ instant: task.startsAt });
  const whenNode = <span className={task.overdue ? "text-destructive" : undefined}>{when}</span>;
  const facts: KeyFact[] = [
    {
      label: t(task.shape === "DEADLINE" ? "dueAt" : "when"),
      preheader: dates.date({ instant: task.startsAt, weekday: "short" }),
      value: editable({ group: "when", node: whenNode }),
    },
    {
      label: t("customer"),
      truncate: true,
      title: names.customer ?? EMPTY,
      value: names.customer ? (
        <Link href={customerRoute({ id: task.customerId })}>{names.customer}</Link>
      ) : (
        EMPTY
      ),
    },
    { label: t("contact"), value: editable({ group: "contact", node: names.contact ?? EMPTY }) },
    {
      label: t("assignee"),
      value: editable({ group: "assignee", node: names.assignee ?? t("unassigned") }),
    },
    {
      label: t("order"),
      value:
        task.orderId && names.order ? (
          <Link href={orderRoute({ id: task.orderId })}>{names.order}</Link>
        ) : (
          (names.order ?? t("noOrder"))
        ),
    },
  ];
  return <KeyFacts facts={facts} />;
}
