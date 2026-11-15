import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { canView } from "../../shared/can-view";
import { invalid } from "../../shared/errors";
import { requireUser } from "../../shared/require-user";
import { addDays, compareDates, parseIsoDate } from "../../time/plain-date";
import { resolveHorizon } from "../dashboard/horizon";
import { periodOf } from "../finance/period";
import { myCards } from "./cards";
import { concernsOf } from "./concerns";
import { nextCardDay } from "./lines";
import { MY_WORK_MAX_DAYS, MyWorkInputSchema, MyWorkSchema } from "./schema";

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

export const myWorkOperations = [viewMyWork];
