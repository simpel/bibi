"use client";

import {
  type ColumnDef,
  createTableColumns,
  dateColumn,
  statusColumn,
  TaskCheckbox,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ClientDataTable } from "@/components/data-table/client-data-table";
import type { QuickFilterPill } from "@/components/data-table/table-filter-bar";
import type { TableQualifier } from "@/components/data-table/table-filter-query";
import { Link, useRouter } from "@/lib/navigation";
import { taskRoute } from "@/lib/routes";
import { useToastAction } from "@/lib/use-toast-action";
import { setTaskDoneAction } from "../actions";
import { TASK_STATE_COLORS, type TaskListRow, type TaskState } from "./task-list-row";

export type TaskTableProps = { rows: TaskListRow[]; canEdit: boolean };

const distinct = ({ values }: { values: string[] }) => [...new Set(values)];

/** `/tasks`' table: done checkbox and type, customer, assignee, state and due time. */
export function TaskTable({ rows, canEdit }: TaskTableProps) {
  const t = useTranslations("task");
  const common = useTranslations("common");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const state = ({ value }: { value: TaskState }) => t(`state.${value}`);
  const toggle = ({ id, done }: { id: string; done: boolean }) =>
    run({
      action: () => setTaskDoneAction({ id, done }),
      messages: { pending: common("saving"), success: t(done ? "completed" : "reopened") },
      onSuccess: () => router.refresh(),
    });
  const columns: ColumnDef<TaskListRow>[] = createTableColumns<TaskListRow>({
    primary: [
      {
        id: "type",
        header: t("columns.task"),
        accessorFn: (row) => row.typeName,
        cell: ({ row: { original } }) => (
          <span className="flex items-center gap-2">
            {/* The checkbox completes the task without opening it. */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: only keeps the row click from firing; the checkbox handles the keyboard */}
            <span
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <TaskCheckbox
                checked={original.state === "done"}
                disabled={!canEdit || pending}
                label={t(original.state === "done" ? "reopen" : "complete", {
                  name: original.typeName,
                })}
                className="mt-0"
                onCheckedChange={(done) => toggle({ id: original.id, done })}
              />
            </span>
            <Link href={taskRoute({ id: original.id })} className="font-medium hover:underline">
              {original.typeName}
            </Link>
          </span>
        ),
      },
    ],
    relations: [
      { id: "customer", header: t("columns.customer"), accessorFn: (row) => row.customerName },
      { id: "assignee", header: t("columns.assignee"), accessorFn: (row) => row.assigneeName },
    ],
    status: [
      statusColumn<TaskListRow>({
        header: t("columns.state"),
        getStatus: (row) => ({
          label: state({ value: row.state }),
          color: TASK_STATE_COLORS[row.state],
        }),
      }),
      statusColumn<TaskListRow>({
        id: "pipelineStatus",
        header: t("columns.status"),
        getStatus: (row) =>
          row.status ? { label: row.status.name, color: row.status.color } : null,
      }),
    ],
    dates: [
      dateColumn<TaskListRow>({
        id: "due",
        header: t("columns.due"),
        getSortValue: (row) => row.dueAtMs,
        cell: (row) => (
          <span
            className={
              row.state === "overdue"
                ? "text-destructive"
                : row.hasDueTime
                  ? undefined
                  : "text-muted-foreground"
            }
          >
            {row.timeLabel}
          </span>
        ),
      }),
    ],
  });
  const qualifiers: TableQualifier<TaskListRow>[] = [
    {
      key: "is",
      label: t("query.is"),
      hint: [state({ value: "open" }), state({ value: "done" }), state({ value: "overdue" })].join(
        ", ",
      ),
      // Localized and canonical words both match (`is:open`); overdue tasks are open too.
      pick: (row) =>
        row.state === "overdue"
          ? [state({ value: "overdue" }), "overdue", state({ value: "open" }), "open"]
          : [state({ value: row.state }), row.state],
      options: [state({ value: "open" }), state({ value: "done" }), state({ value: "overdue" })],
    },
    {
      key: "assignee",
      label: t("query.assignee"),
      pick: (row) => [row.assigneeName, ...(row.mine ? [t("query.me"), "me"] : [])],
      options: distinct({ values: [t("query.me"), ...rows.map((row) => row.assigneeName)] }),
    },
    {
      key: "customer",
      label: t("query.customer"),
      pick: (row) => row.customerName,
      options: distinct({ values: rows.map((row) => row.customerName) }),
    },
    {
      key: "status",
      label: t("query.status"),
      pick: (row) => row.status?.name ?? [],
      options: distinct({ values: rows.flatMap((row) => (row.status ? [row.status.name] : [])) }),
    },
    {
      key: "type",
      label: t("query.type"),
      pick: (row) => row.typeName,
      options: distinct({ values: rows.map((row) => row.typeName) }),
    },
  ];
  const pills: QuickFilterPill[] = [
    { key: "all", label: common("readFilter.all"), query: undefined },
    ...(["open", "overdue", "done"] as const).map((key) => ({
      key,
      label: state({ value: key }),
      query: `is:${state({ value: key })}`,
    })),
  ];
  return (
    <ClientDataTable
      tableId="task"
      columns={columns}
      data={rows}
      qualifiers={qualifiers}
      pills={pills}
      getSearchText={(row) => `${row.typeName} ${row.customerName} ${row.assigneeName}`}
      getRowId={(row) => row.id}
      onRowClick={(row) => router.push(taskRoute({ id: row.id }))}
      emptyText={t("noMatches")}
    />
  );
}
