import { INBOX_ROUTE } from "@/lib/inbox-routes";
import { orderRoute, quoteRoute, ROUTES } from "@/lib/routes";
import type { MyWorkTodoWireish } from "../ui/my-work-wireish";

export type TodoRow = { key: string; href: string; title: string; detail: string; at: number };

type When = Date | string;

export type TodoTexts = {
  order: (row: { reference: number; title: string | null }) => string;
  date: (value: When) => string;
  runSheet: (values: {
    status: "DRAFT" | "REVISION_PENDING" | "BLOCKED";
    runSheet: string;
    order: string;
  }) => string;
  runSheetDetail: (values: { version: number; date: string }) => string;
  hold: (values: { order: string; date: string }) => string;
  holdDetail: (values: { count: number }) => string;
  quote: (values: { order: string }) => string;
  quoteDetail: (values: { sent: string; valid: string | null }) => string;
  messages: (values: { order: string; count: number }) => string;
  messagesDetail: (values: { date: string }) => string;
};

const time = ({ value }: { value: When }) => new Date(value).getTime();

/** Everything to act on as one list, soonest first: run sheets, holds, quotes, messages. */
export function todoRows({
  todo,
  texts,
}: {
  todo: MyWorkTodoWireish;
  texts: TodoTexts;
}): TodoRow[] {
  const runSheets = (todo.runSheets ?? []).map((row) => ({
    key: `runSheet:${row.runSheetId}`,
    href: `${ROUTES.runSheets}/${encodeURIComponent(row.runSheetId)}`,
    title: texts.runSheet({
      status: row.status,
      runSheet: row.runSheetName,
      order: texts.order(row),
    }),
    detail: texts.runSheetDetail({ version: row.version, date: texts.date(row.startsAt) }),
    at: time({ value: row.startsAt }),
  }));
  const holds = todo.expiringHolds.map((row) => ({
    key: `hold:${row.orderId}`,
    href: orderRoute({ id: row.orderId }),
    title: texts.hold({ order: texts.order(row), date: texts.date(row.holdsUntil) }),
    detail: texts.holdDetail({ count: row.lines }),
    at: time({ value: row.holdsUntil }),
  }));
  const quotes = (todo.quotes ?? []).map((row) => ({
    key: `quote:${row.quoteId}`,
    href: quoteRoute({ id: row.quoteId }),
    title: texts.quote({ order: texts.order(row) }),
    detail: texts.quoteDetail({
      sent: texts.date(row.sentAt),
      valid: row.validUntil ? texts.date(row.validUntil) : null,
    }),
    at: row.validUntil ? time({ value: row.validUntil }) : Number.MAX_SAFE_INTEGER,
  }));
  const messages = (todo.messages ?? []).map((row) => ({
    key: `messages:${row.orderId}`,
    href: orderRoute({ id: row.orderId }),
    title: texts.messages({ order: texts.order(row), count: row.unread }),
    detail: texts.messagesDetail({ date: texts.date(row.latestAt) }),
    at: time({ value: row.latestAt }),
  }));
  return [...runSheets, ...holds, ...quotes, ...messages].sort((a, b) => a.at - b.at);
}

export type TodoMore = {
  key: string;
  href: string;
  count: number;
  part: "runSheets" | "expiringHolds" | "quotes" | "messages";
};

/** For each To do part with more than it lists, how many more and where the full list is. */
export function todoMore({ todo }: { todo: MyWorkTodoWireish }): TodoMore[] {
  const shown = {
    runSheets: todo.runSheets?.length ?? 0,
    expiringHolds: todo.expiringHolds.length,
    quotes: todo.quotes?.length ?? 0,
    messages: todo.messages?.length ?? 0,
  };
  const hrefs = {
    runSheets: `${ROUTES.runSheets}?q=${encodeURIComponent("involves:me is:current is:unsent")}`,
    expiringHolds: ROUTES.orders,
    quotes: ROUTES.quotes,
    messages: INBOX_ROUTE,
  };
  return (["runSheets", "expiringHolds", "quotes", "messages"] as const).flatMap((part) => {
    const count = (todo.totals[part] ?? 0) - shown[part];
    return count > 0 ? [{ key: part, part, href: hrefs[part], count }] : [];
  });
}
