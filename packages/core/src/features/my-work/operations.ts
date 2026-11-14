import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { invalid } from "../../shared/errors";
import { requireUser } from "../../shared/require-user";
import { addDays, compareDates, parseIsoDate } from "../../time/plain-date";
import { resolveHorizon } from "../dashboard/horizon";
import { periodOf } from "../finance/period";
import { toNotificationDto } from "../notification/to-notification-dto";
import { countUnread } from "../notification/unread";
import { concernsOf } from "./concerns";
import { myRows } from "./rows";
import {
  MY_WORK_MAX_DAYS,
  MY_WORK_NOTIFICATION_LIMIT,
  MY_WORK_TODO_DAYS,
  MyWorkInputSchema,
  MyWorkSchema,
} from "./schema";
import { todoOf } from "./todo";

const DAY_MS = 86_400_000;

/**
 * The caller's start page (spec: home): what concerns them in a period of days. A view read model
 * (ADR 0071) over the caller's own work: run sheet rows need `runSheet:read`, quotes
 * `quote:read`, customer messages `inbox:read`, customer names `customer:read`.
 */
export const viewMyWork = defineOperation({
  name: "myWork.view",
  kind: "query",
  description:
    "The caller's own work for a period of days (at most 14): every item row of the current run " +
    "sheets that concern them, by time (what to prepare, run or set up), with each row's counts, " +
    "status and why it concerns them; what they must act on (run sheets to send or unblock, holds " +
    "running out, quotes waiting on the customer, unread customer messages on their orders); and " +
    "their latest unread notifications. Concerns = main assignee or follower of the order, " +
    "assignee or follower of the run sheet's responsibility, staffed on the line, assignee or " +
    "follower of the line's item, or recipient of the run sheet. Rows are null without " +
    "runSheet:read, quotes without quote:read, messages without inbox:read.",
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
    const aheadEnd = Math.max(
      period.end.getTime(),
      horizon.now.getTime() + MY_WORK_TODO_DAYS * DAY_MS,
    );
    const ahead = { start: horizon.start, end: new Date(aheadEnd) };
    const reach = {
      start: new Date(Math.min(period.start.getTime(), ahead.start.getTime())),
      end: ahead.end,
    };
    const concerns = await concernsOf({ context, userId: user.value, window: reach });
    const window = { start: period.start, end: period.end };
    const [rows, todo, unread, latest] = await Promise.all([
      canView({ context, feature: "runSheet" }) ? myRows({ context, concerns, window }) : null,
      todoOf({ context, concerns, ahead, horizon }),
      countUnread({ context, recipientUserId: user.value }),
      context.db.notification.findMany({
        where: { recipientUserId: user.value, readAt: null },
        orderBy: { createdAt: "desc" },
        take: MY_WORK_NOTIFICATION_LIMIT,
      }),
    ]);
    return ok({
      value: {
        ...{ from: input.from, to: input.to, timeZone: horizon.timeZone },
        rows: rows?.rows ?? null,
        truncated: rows?.truncated ?? false,
        todo,
        unreadNotifications: unread,
        notifications: latest.map((row) => toNotificationDto({ row, context })),
      },
    });
  },
});

export const myWorkOperations = [viewMyWork];
