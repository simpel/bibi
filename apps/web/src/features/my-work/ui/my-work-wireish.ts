import type { MyWork, MyWorkTodo } from "@bibi/core/schemas";

type Dated<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date | string };
type Datable<T, K extends keyof T> = Omit<T, K> & { [P in K]: Date | string | null };
type Item<T> = NonNullable<T> extends (infer U)[] ? U : never;

export type MyWorkRowWireish = Datable<Dated<Item<MyWork["rows"]>, "at">, "endsAt">;

/** The todo as the page has it (dates) or as a tool result carries it (ISO strings). */
export type MyWorkTodoWireish = {
  runSheets: Dated<Item<MyWorkTodo["runSheets"]>, "startsAt">[] | null;
  expiringHolds: Dated<Item<MyWorkTodo["expiringHolds"]>, "holdsUntil">[];
  quotes: Datable<Dated<Item<MyWorkTodo["quotes"]>, "sentAt">, "validUntil">[] | null;
  messages: Dated<Item<MyWorkTodo["messages"]>, "latestAt">[] | null;
  totals: MyWorkTodo["totals"];
};

/** The caller's work as the page or the assistant's card has it, so both share the panels. */
export type MyWorkWireish = Pick<
  MyWork,
  "from" | "to" | "timeZone" | "page" | "limit" | "rowsTotal"
> & {
  rows: MyWorkRowWireish[] | null;
  todo: MyWorkTodoWireish;
};
