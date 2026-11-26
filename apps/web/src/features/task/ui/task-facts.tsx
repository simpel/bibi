import type { TaskDto } from "@bibi/core";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import type { NamedOption } from "@/components/form/named-option";
import { EditableFact } from "@/components/inline-edit/editable-fact";
import { Link } from "@/lib/navigation";
import { customerRoute, orderRoute } from "@/lib/routes";
import { getDateTimeFormat } from "@/server/date-time-format";
import type { TaskEditGroup } from "./task-edit-groups";
import type { TaskFormData } from "./task-form-data";
import { TaskInlineEditor } from "./task-inline-editor";
import { TaskOrderFact } from "./task-order-fact";

type Fact = { label: string; value: ReactNode };

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
  /** Set when the caller may change the task's order: the Order fact's pencil. */
  linkableOrders: Promise<readonly NamedOption[]> | null;
};

/** Due time, customer, contact, assignee and order as a list in the side column; each editable fact in place. */
export async function TaskKeyFacts({
  task,
  names,
  canEdit,
  formData,
  linkableOrders,
}: TaskKeyFactsProps) {
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
  const muted = ({ text }: { text: string }) => (
    <span className="text-muted-foreground">{text}</span>
  );
  const dueNode = task.dueAt ? (
    <span className="grid">
      <span className="text-xs text-muted-foreground">
        {dates.date({ instant: task.dueAt, weekday: "short" })}
      </span>
      <span className={task.overdue ? "text-destructive" : undefined}>
        {dates.time({ instant: task.dueAt })}
      </span>
    </span>
  ) : (
    muted({ text: t("noDueTime") })
  );
  const contactNode = names.contact ?? muted({ text: t("noContact") });
  const facts: Fact[] = [
    { label: t("dueAt"), value: editable({ group: "due", node: dueNode }) },
    {
      label: t("customer"),
      value: editable({
        group: "customer",
        node:
          names.customer && task.customerId ? (
            <Link href={customerRoute({ id: task.customerId })} className="hover:underline">
              {names.customer}
            </Link>
          ) : (
            muted({ text: t("noCustomer") })
          ),
      }),
    },
    {
      label: t("contact"),
      // A contact works at a customer: without one there is nobody to pick.
      value: task.customerId ? editable({ group: "contact", node: contactNode }) : contactNode,
    },
    {
      label: t("assignee"),
      value: editable({
        group: "assignee",
        node: names.assignee ?? muted({ text: t("unassigned") }),
      }),
    },
    {
      label: t("order"),
      value: (
        <TaskOrderFact
          taskId={task.id}
          currentOrderId={task.orderId}
          linkableOrders={linkableOrders}
        >
          {task.orderId && names.order ? (
            <Link href={orderRoute({ id: task.orderId })} className="hover:underline">
              {names.order}
            </Link>
          ) : (
            (names.order ?? muted({ text: t("noOrder") }))
          )}
        </TaskOrderFact>
      ),
    },
  ];
  return (
    <dl className="grid gap-4">
      {facts.map((fact) => (
        <div key={fact.label} className="grid min-w-0 gap-0.5">
          <dt className="text-sm font-medium text-muted-foreground">{fact.label}</dt>
          <dd className="min-w-0 text-sm">{fact.value}</dd>
        </div>
      ))}
    </dl>
  );
}
