import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import { concernsOf } from "./concerns";
import { concernedOrderIds } from "./lines";
import { lineIssueTasks } from "./task-line-issues";
import {
  customerTasks,
  holdTasks,
  notClosedTasks,
  orderSpans,
  overdueTasks,
  type RawTask,
  runSheetTasks,
  unconfirmedTasks,
} from "./task-sources";
import type { TaskWindow } from "./task-window";
import {
  MY_WORK_TASK_GROUPS,
  MY_WORK_TASK_KINDS,
  type MyWorkTask,
  type MyWorkTaskGroup,
  type MyWorkTaskKind,
} from "./tasks-schema";

type Context = Pick<OperationContext, "db" | "permissions">;

const BLOCKING: ReadonlySet<MyWorkTaskKind> = new Set(["HARD_CLASH", "RUN_SHEET_BLOCKED"]);

/** Blocked and waiting by kind; the rest by when they are due (spec: home, "Needs you"). */
function groupOf({ task, window }: { task: RawTask; window: TaskWindow }): MyWorkTaskGroup {
  if (BLOCKING.has(task.kind)) return "BLOCKED";
  if (task.kind === "QUOTE_WAITING") return "WAITING";
  if (task.dueAt < window.now) return "LATE";
  return task.dueAt < window.todayEnd ? "TODAY" : "SOON";
}

const rank = ({ task }: { task: MyWorkTask }) => [
  MY_WORK_TASK_GROUPS.indexOf(task.group),
  task.dueAt.getTime(),
  task.reference,
  MY_WORK_TASK_KINDS.indexOf(task.kind),
];

function compare({ a, b }: { a: MyWorkTask; b: MyWorkTask }): number {
  const left = rank({ task: a });
  const right = rank({ task: b });
  for (let i = 0; i < left.length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.key.localeCompare(b.key);
}

const EMPTY = {
  ...{ runSheetId: null, runSheetName: null, lineId: null, lineName: null, issueKind: null },
  ...{ otherReference: null, quoteId: null, invoiceId: null, amountMinor: null, count: null },
} as const;

type FinishInput = { context: Context; raw: RawTask[]; window: TaskWindow };

/** Adds each task's order, key and group, drops what is due after next week, and sorts. */
async function finish({ context, raw, window }: FinishInput): Promise<MyWorkTask[]> {
  const ids = [...new Set(raw.map((task) => task.orderId))];
  const orders = await context.db.order.findMany({
    where: { id: { in: ids } },
    select: { id: true, reference: true, title: true, customer: { select: { name: true } } },
  });
  const byId = new Map(orders.map((order) => [order.id, order]));
  return raw
    .flatMap(({ id, ...task }): MyWorkTask[] => {
      const order = byId.get(task.orderId);
      const group = groupOf({ task, window });
      if (!order || (group === "SOON" && task.dueAt >= window.end)) return [];
      const customerName = visibleTo({ context, feature: "customer", value: order.customer.name });
      return [
        {
          ...EMPTY,
          ...task,
          key: [task.kind, task.orderId, ...(id ? [id] : [])].join(":"),
          ...{ group, reference: order.reference, title: order.title, customerName },
        },
      ];
    })
    .sort((a, b) => compare({ a, b }));
}

export type MyTasksInput = { context: Context; userId: string; window: TaskWindow };

/**
 * Everything the member must act on (spec: home, "Needs you"), derived on read (ADR 0110).
 * Order-wide tasks reach the order's main assignee; run sheet tasks also the owner or follower
 * of the run sheet's responsibility.
 */
export async function myTasks({ context, userId, window }: MyTasksInput): Promise<MyWorkTask[]> {
  const concerns = await concernsOf({
    ...{ context, userId },
    window: { start: window.now, end: window.end },
  });
  const own = [...concerns.orders].flatMap(([id, reasons]) =>
    reasons.has("ASSIGNEE") ? [id] : [],
  );
  // Every order that concerns the member; run sheets keep only those they act on (`acts`).
  const spans = await orderSpans({ context, orderIds: [...concernedOrderIds({ concerns })] });
  const ownSet = new Set(own);
  const ownSpans = new Map([...spans].filter(([id]) => ownSet.has(id)));
  const coming = [...ownSpans]
    .filter(([, span]) => span.lastEnd > window.now && span.firstStart < window.end)
    .sort(([, a], [, b]) => a.firstStart.getTime() - b.firstStart.getTime())
    .map(([id]) => id);
  const base = { context, window };
  const [sheets, unconfirmed, holds, customer, overdue, open, issues] = await Promise.all([
    runSheetTasks({ ...base, concerns, spans }),
    unconfirmedTasks({ ...base, spans: ownSpans }),
    holdTasks({ ...base, orderIds: own }),
    customerTasks({ ...base, orderIds: own }),
    overdueTasks({ ...base, orderIds: own }),
    notClosedTasks({ ...base, spans: ownSpans }),
    lineIssueTasks({ ...base, orderIds: coming }),
  ]);
  const asked = new Set(unconfirmed.map((task) => task.orderId));
  const raw = [
    ...issues,
    ...sheets,
    ...unconfirmed,
    ...holds.filter((task) => !asked.has(task.orderId)),
    ...customer,
    ...overdue,
    ...open,
  ];
  return finish({ context, raw, window });
}
