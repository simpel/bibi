import {
  type ExpiringHold,
  ExpiringHoldSchema,
  type MyWork,
  MyWorkMessagesSchema,
  MyWorkNeedSchema,
  MyWorkQuoteSchema,
  type MyWorkRow,
  MyWorkRowSchema,
  MyWorkRunSheetTaskSchema,
  type MyWorkTodo,
  MyWorkTodoSchema,
  viewMyWork,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";
import { NotificationRef } from "../notification/graphql";

type Need = z.infer<typeof MyWorkNeedSchema>;
type Task = z.infer<typeof MyWorkRunSheetTaskSchema>;
type Quote = z.infer<typeof MyWorkQuoteSchema>;
type Messages = z.infer<typeof MyWorkMessagesSchema>;

const NeedRef = objectFromSchema<Need>({
  name: "MyWorkNeed",
  schema: MyWorkNeedSchema,
  description: "A count on a run sheet row, for the line or the whole order.",
});
const RowRef = objectFromSchema<MyWorkRow>({
  name: "MyWorkRow",
  schema: MyWorkRowSchema,
  omit: ["needs"],
  description: "One thing to prepare, run or set up: an item row of a current run sheet.",
});
builder.objectField(RowRef, "needs", (t) =>
  t.field({ type: [NeedRef], resolve: (row) => row.needs }),
);

const TaskRef = objectFromSchema<Task>({
  name: "MyWorkRunSheetTask",
  schema: MyWorkRunSheetTaskSchema,
  description: "A run sheet to send or unblock.",
});
const QuoteRef = objectFromSchema<Quote>({
  name: "MyWorkQuote",
  schema: MyWorkQuoteSchema,
  description: "A sent quote waiting on the customer.",
});
const MessagesRef = objectFromSchema<Messages>({
  name: "MyWorkMessages",
  schema: MyWorkMessagesSchema,
  description: "Unread customer messages on one order.",
});
const HoldRef = objectFromSchema<ExpiringHold>({
  name: "MyWorkExpiringHold",
  schema: ExpiringHoldSchema,
  description: "An order of the caller's whose expiring holds run out soon.",
});

const TotalsRef = objectFromSchema<MyWorkTodo["totals"]>({
  name: "MyWorkTodoTotals",
  schema: MyWorkTodoSchema.shape.totals,
  description: "How many of each To do part there are; each list holds at most five.",
});

const TodoRef = builder.objectRef<MyWorkTodo>("MyWorkTodo").implement({
  description: "What the caller must act on. Parts the caller may not read are null.",
  fields: (t) => ({
    runSheets: t.field({ type: [TaskRef], nullable: true, resolve: (todo) => todo.runSheets }),
    expiringHolds: t.field({ type: [HoldRef], resolve: (todo) => todo.expiringHolds }),
    quotes: t.field({ type: [QuoteRef], nullable: true, resolve: (todo) => todo.quotes }),
    messages: t.field({ type: [MessagesRef], nullable: true, resolve: (todo) => todo.messages }),
    totals: t.field({ type: TotalsRef, resolve: (todo) => todo.totals }),
  }),
});

const MyWorkRef = builder.objectRef<MyWork>("MyWork").implement({
  description: "The caller's own work for a period of days (spec: home).",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    timeZone: t.exposeString("timeZone"),
    rows: t.field({ type: [RowRef], nullable: true, resolve: (work) => work.rows }),
    page: t.exposeInt("page"),
    limit: t.exposeInt("limit"),
    rowsTotal: t.exposeInt("rowsTotal"),
    todo: t.field({ type: TodoRef, resolve: (work) => work.todo }),
    unreadNotifications: t.exposeInt("unreadNotifications"),
    notifications: t.field({ type: [NotificationRef], resolve: (work) => work.notifications }),
  }),
});

fieldFromOperation({ operation: viewMyWork, type: MyWorkRef, name: "myWork" });
