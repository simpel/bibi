import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { invalid, notFound } from "../../shared/errors";
import { requireUser } from "../../shared/require-user";
import { addDays, compareDates, parseIsoDate } from "../../time/plain-date";
import { resolveHorizon } from "../dashboard/horizon";
import { periodOf } from "../finance/period";
import { myCards } from "./cards";
import { concernsOf } from "./concerns";
import { taskFingerprint, withoutDismissed } from "./dismissals";
import { nextCardDay } from "./lines";
import { MY_WORK_MAX_DAYS, MyWorkInputSchema, MyWorkSchema } from "./schema";
import { resolveTaskWindow } from "./task-window";
import { myTasks } from "./tasks";
import {
  MyWorkDismissTaskInputSchema,
  MyWorkDismissTaskOutputSchema,
  MyWorkTasksInputSchema,
  MyWorkTasksSchema,
} from "./tasks-schema";

/**
 * The caller's start page (spec: home): a timeline of the orders that concern them, one card per
 * order per day. A view read model (ADR 0071) over the caller's own work: cards need
 * `order:read`, the customer `customer:read`, the status `pipeline:read`, places `item:read`
 * and each flag its feature's `read`.
 */
export const viewMyWork = defineOperation({
  name: "myWork.view",
  kind: "query",
  description:
    "The caller's own timeline for a period of days (at most 14): one card per order per day it " +
    "has timed lines that concern them, by start. Each card has the order, customer, status, " +
    "the day's span, guests, bookable places, its strongest hold (HARD, SOFT or null), why it " +
    "concerns them and flags, most urgent first: HARD_CLASH (a soft hold overlapped by another " +
    "order's hard hold), and, only where the caller acts on the order, RUN_SHEET (not sent, " +
    "changed or blocked), HOLD_EXPIRES, QUOTE_WAITING and UNREAD_MESSAGES. `next` is the first " +
    "later day with a card, to read on from. Concerns = main " +
    "assignee or follower of the order, assignee or follower of a responsibility on it, staffed " +
    "on a line, assignee or follower of a line's item, or recipient of a run sheet. Cards are " +
    "null without order:read.",
  input: MyWorkInputSchema,
  output: MyWorkSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const from = parseIsoDate({ value: input.from });
    const to = parseIsoDate({ value: input.to });
    if (
      compareDates({ a: to, b: from }) < 0 ||
      compareDates({ a: to, b: addDays({ date: from, days: MY_WORK_MAX_DAYS - 1 }) }) > 0
    ) {
      const message = `to must be on or after from, at most ${MY_WORK_MAX_DAYS} days`;
      return invalid({ message, issues: [{ path: "to", message }] });
    }
    const horizon = await resolveHorizon({ context });
    const period = periodOf({ from, to, timeZone: horizon.timeZone });
    const window = { start: period.start, end: period.end };
    const readable = canView({ context, feature: "order" });
    const [cards, next] = readable
      ? await Promise.all([
          concernsOf({ context, userId: user.value, window }).then((concerns) =>
            myCards({ context, concerns, window, horizon }),
          ),
          nextCardDay({
            context,
            userId: user.value,
            after: window.end,
            timeZone: horizon.timeZone,
          }),
        ])
      : [null, null];
    return ok({
      value: {
        from: input.from,
        to: input.to,
        timeZone: horizon.timeZone,
        now: horizon.now,
        cards,
        next,
      },
    });
  },
});

/**
 * Needs you (spec: home): what the caller must act on now, derived on read (ADR 0110). A view
 * read model (ADR 0071): tasks need `order:read`, and each kind its feature's `read`.
 */
export const viewMyTasks = defineOperation({
  name: "myWork.tasks",
  kind: "query",
  description:
    "What the caller must act on, grouped BLOCKED, LATE (due before now), TODAY, SOON (due by " +
    "the end of next week) and WAITING (on the customer), by due then reference. Kinds: " +
    "HARD_CLASH (another order's hard hold or a block overlaps a line), RUN_SHEET_BLOCKED, " +
    "LINE_ISSUE (a planning issue on a line, e.g. over capacity, outside hours), RUN_SHEET_UNSENT " +
    "(not sent or changed since sent; due 24 h before the order's first line), UNCONFIRMED " +
    "(soft holds; due 48 h before the first line), HOLD_EXPIRES (within 7 days), " +
    "UNREAD_MESSAGES, PAYMENT_OVERDUE (an invoice past its due date), NOT_CLOSED (every line " +
    "ended in the last 30 days, the status does not close) and QUOTE_WAITING. Order-wide tasks " +
    "reach the order's main assignee; run sheet tasks also the owner or follower of its " +
    "responsibility. Tasks are null without order:read.",
  input: MyWorkTasksInputSchema,
  output: MyWorkTasksSchema,
  permission: "self:read",
  handler: async ({ input, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    const window = await resolveTaskWindow({ context });
    const all = canView({ context, feature: "order" })
      ? await withoutDismissed({
          context,
          userId: user.value,
          tasks: await myTasks({ context, userId: user.value, window }),
        })
      : null;
    const kinds = input.kinds ? new Set(input.kinds) : null;
    const tasks = all && kinds ? all.filter((task) => kinds.has(task.kind)) : all;
    return ok({ value: { now: window.now, timeZone: window.timeZone, tasks } });
  },
});

/**
 * Dismisses one of the caller's Needs you tasks for them alone (ADR 0114): the tasks are derived
 * again, and the task's facts are stored, so it is back when they change. A key that is not one
 * of the caller's tasks now is `NOT_FOUND`.
 */
export const dismissMyTask = defineOperation({
  name: "myWork.dismissTask",
  kind: "command",
  description:
    "Dismiss one of the caller's own Needs you tasks by its `key` from myWork.tasks (ADR 0114). " +
    "It is hidden for the caller only, until its facts change (its due time, count, amount, the " +
    "clashing order or the issue); then it shows again. Colleagues who get the same task still " +
    "see it.",
  input: MyWorkDismissTaskInputSchema,
  output: MyWorkDismissTaskOutputSchema,
  permission: "self:write",
  handler: async ({ input: { key }, context }) => {
    const user = requireUser({ context });
    if (!user.ok) return user;
    if (!canView({ context, feature: "order" })) return notFound({ entity: "Task" });
    const window = await resolveTaskWindow({ context });
    const tasks = await myTasks({ context, userId: user.value, window });
    const task = tasks.find((candidate) => candidate.key === key);
    if (!task) return notFound({ entity: "Task" });
    const fingerprint = taskFingerprint({ task });
    const where = {
      organizationId_userId_taskKey: {
        organizationId: context.organizationId,
        userId: user.value,
        taskKey: key,
      },
    };
    const before = await context.db.needsYouDismissal.findUnique({
      where,
      select: { fingerprint: true },
    });
    const row = await context.db.needsYouDismissal.upsert({
      where,
      create: {
        organizationId: context.organizationId,
        userId: user.value,
        orderId: task.orderId,
        taskKey: key,
        fingerprint,
      },
      update: { fingerprint },
      select: { id: true },
    });
    context.recordChange({
      entityId: row.id,
      before: before ?? undefined,
      after: { taskKey: key, fingerprint },
    });
    return ok({ value: { key } });
  },
});

export const myWorkOperations = [viewMyWork, viewMyTasks, dismissMyTask];
