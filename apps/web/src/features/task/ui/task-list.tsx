import { listCustomers, listTasks, type OrderStatusDto, type TaskDto } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { nameOf } from "@/components/form/named-option";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadOrderStatuses } from "@/features/order/load-order-names";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { can, getCallerAbilities } from "@/server/caller-abilities";
import { getDateTimeFormat } from "@/server/date-time-format";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { taskTimeLabel } from "../lib/task-time-label";
import { loadMemberNames } from "../load-member-names";
import type { TaskListRow, TaskState } from "./task-list-row";
import { TaskTable } from "./task-table";

export type TaskListProps = { locale: Locale };

const LIMIT = 100;
/** Done tasks stay in the list this long. */
const DONE_DAYS = 30;

const stateOf = ({ task }: { task: TaskDto }): TaskState =>
  task.doneAt ? "done" : task.overdue ? "overdue" : "open";

/** The status a task without an order sits in; null when it has an order or none. */
const statusOf = ({ task, statuses }: { task: TaskDto; statuses: readonly OrderStatusDto[] }) => {
  const status = task.orderId ? undefined : statuses.find(({ id }) => id === task.statusId);
  return status ? { name: status.name, color: status.color } : null;
};

/** Every open task and those done in the last 30 days, one page each. */
async function loadTasks() {
  const since = new Date(Date.now() - DONE_DAYS * 24 * 60 * 60 * 1000);
  const [open, done] = await Promise.all([
    runOperation({ operation: listTasks, input: { state: "open", limit: LIMIT } }),
    runOperation({ operation: listTasks, input: { state: "done", from: since, limit: LIMIT } }),
  ]);
  if (!open.ok) return open;
  if (!done.ok) return done;
  return { ok: true as const, value: [...open.value.items, ...done.value.items] };
}

/** `/tasks`: site visits, tastings and notes, with or without a customer and a time (ADR 0117, 0120). */
export async function TaskList({ locale }: TaskListProps) {
  const [t, abilities, dates, tasks, members, customers, statuses] = await Promise.all([
    getTranslations("task"),
    getCallerAbilities(),
    getDateTimeFormat(),
    loadTasks(),
    loadMemberNames(),
    runOperation({ operation: listCustomers, input: { limit: LIMIT } }),
    loadOrderStatuses(),
  ]);
  if (!tasks.ok) return <ErrorState errorKey={handleLoadError({ error: tasks.error, locale })} />;
  const customerOptions = customers.ok ? customers.value.items : [];
  const statusOptions = statuses.ok ? statuses.value : [];
  const rows: TaskListRow[] = tasks.value.map((task) => ({
    id: task.id,
    typeName: task.type.name,
    customerName: nameOf({ options: customerOptions, id: task.customerId }),
    assigneeName: nameOf({ options: members, id: task.assigneeId }),
    mine: task.assigneeId !== null && task.assigneeId === abilities.userId,
    state: stateOf({ task }),
    status: statusOf({ task, statuses: statusOptions }),
    dueAtMs: task.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER,
    timeLabel: task.dueAt
      ? taskTimeLabel({ task: { dueAt: task.dueAt }, dates })
      : t("fields.noDueTime"),
    hasDueTime: task.dueAt !== null,
  }));
  const canWrite = can({ abilities, permission: "task:write" });
  const create = canWrite ? (
    <Button asChild>
      <Link href={ROUTES.taskNew}>{t("create")}</Link>
    </Button>
  ) : undefined;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("plural")} description={t("listDescription")} actions={create} />
      {rows.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} action={create} />
      ) : (
        <TaskTable rows={rows} canEdit={canWrite} />
      )}
    </div>
  );
}
