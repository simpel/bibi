import { getContact, type TaskDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { cn, StatusBadge } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { DeferredSection } from "@/components/states/deferred-section";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadCustomer } from "@/features/customer/load-customer";
import { loadOrder } from "@/features/order/load-order";
import { taskRoute } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { loadLinkableOrders } from "../load-linkable-orders";
import { loadMemberNames } from "../load-member-names";
import { loadTask } from "../load-task";
import { taskFormDataPromise } from "../load-task-form-data";
import { TaskDangerArea } from "./task-danger-area";
import { TaskDetailsSection } from "./task-details-section";
import { type TaskFactNames, TaskKeyFacts } from "./task-facts";
import { TaskHeaderActions } from "./task-header-actions";
import { TASK_STATE_COLORS, type TaskState } from "./task-list-row";

export type TaskDetailProps = { locale: Locale; id: string };

/** The task's own names by id: customer, contact, linked order and assignee (ADR 0097). */
async function loadFactNames({ task }: { task: TaskDto }): Promise<TaskFactNames> {
  const [customer, contact, order, members] = await Promise.all([
    task.customerId ? loadCustomer({ id: task.customerId }) : null,
    task.contactId ? runOperation({ operation: getContact, input: { id: task.contactId } }) : null,
    task.orderId ? loadOrder({ id: task.orderId }) : null,
    loadMemberNames(),
  ]);
  const linked = order?.ok ? order.value : null;
  return {
    customer: customer?.ok ? customer.value.name : null,
    contact: contact?.ok ? contact.value.name : null,
    assignee: members.find((member) => member.id === task.assigneeId)?.name ?? null,
    order: linked ? `#${linked.reference} ${linked.title ?? ""}`.trim() : null,
  };
}

/** `/tasks/{id}`: the task edited in place, done from the header like Follow, Create order while unlinked. */
export async function TaskDetail({ locale, id }: TaskDetailProps) {
  const [t, abilities, result] = await Promise.all([
    getTranslations("task"),
    getCallerAbilities(),
    loadTask({ id }),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const task = result.value;
  const names = await loadFactNames({ task });
  const canEdit = can({ abilities, permission: "task:write" });
  const done = task.doneAt !== null;
  // A done task is locked: reopen it to edit.
  const canChange = canEdit && !done;
  const name = task.type.name;
  const formData = taskFormDataPromise();
  // An order is offered only with a customer (ADR 0120).
  const linkableOrders = canChange && task.customerId ? loadLinkableOrders({ task }) : null;
  const state: TaskState = done ? "done" : task.overdue ? "overdue" : "open";
  return (
    <div className="grid gap-6">
      <CrumbName href={taskRoute({ id })} name={name} />
      <PageHeader
        title={name}
        heading={
          <div className="grid justify-items-start gap-2">
            <h1 className={cn("text-3xl", done && "text-muted-foreground line-through")}>{name}</h1>
            <StatusBadge label={t(`state.${state}`)} color={TASK_STATE_COLORS[state]} />
          </div>
        }
        actions={
          <TaskHeaderActions
            task={{ id, name, done }}
            canEdit={canEdit}
            canLinkOrder={!task.orderId && canChange && task.customerId !== null}
            linkableOrders={linkableOrders ?? Promise.resolve([])}
            canCreateOrder={!task.orderId && can({ abilities, permission: "order:write" })}
          />
        }
      />
      <DeferredSection>
        <TaskDetailsSection
          task={task}
          canEdit={canChange}
          formData={formData}
          facts={
            <TaskKeyFacts
              task={task}
              names={names}
              canEdit={canChange}
              formData={formData}
              linkableOrders={linkableOrders}
            />
          }
          dangerArea={
            can({ abilities, permission: "task:delete" }) ? (
              <TaskDangerArea task={{ id, name }} />
            ) : null
          }
        />
      </DeferredSection>
    </div>
  );
}
