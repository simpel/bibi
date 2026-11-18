import {
  dismissMyTask,
  type MyWork,
  type MyWorkCard,
  MyWorkCardSchema,
  type MyWorkDismissTaskOutput,
  MyWorkDismissTaskOutputSchema,
  type MyWorkFlag,
  MyWorkFlagSchema,
  type MyWorkTask,
  MyWorkTaskSchema,
  type MyWorkTasks,
  viewMyTasks,
  viewMyWork,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation, mutationFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type Status = NonNullable<MyWorkCard["status"]>;

const FlagRef = objectFromSchema<MyWorkFlag>({
  name: "MyWorkFlag",
  schema: MyWorkFlagSchema,
  description: "Something on a card to look at, most urgent first.",
});
const StatusRef = builder.objectRef<Status>("MyWorkStatus").implement({
  description: "The order's status as the organization names and colours it.",
  fields: (t) => ({ name: t.exposeString("name"), color: t.exposeString("color") }),
});
const CardRef = objectFromSchema<MyWorkCard>({
  name: "MyWorkCard",
  schema: MyWorkCardSchema,
  omit: ["status", "flags"],
  description: "One order on one day it has lines that concern the caller.",
});
builder.objectFields(CardRef, (t) => ({
  status: t.field({ type: StatusRef, nullable: true, resolve: (card) => card.status }),
  flags: t.field({ type: [FlagRef], resolve: (card) => card.flags }),
}));

const MyWorkRef = builder.objectRef<MyWork>("MyWork").implement({
  description: "The caller's own timeline for a period of days (spec: home).",
  fields: (t) => ({
    from: t.exposeString("from"),
    to: t.exposeString("to"),
    timeZone: t.exposeString("timeZone"),
    now: t.field({ type: "DateTime", resolve: (work) => work.now }),
    cards: t.field({ type: [CardRef], nullable: true, resolve: (work) => work.cards }),
    next: t.exposeString("next", { nullable: true }),
  }),
});

fieldFromOperation({ operation: viewMyWork, type: MyWorkRef, name: "myWork" });

const TaskRef = objectFromSchema<MyWorkTask>({
  name: "MyWorkTask",
  schema: MyWorkTaskSchema,
  description: "One thing the caller must act on (spec: home, Needs you).",
});

const MyWorkTasksRef = builder.objectRef<MyWorkTasks>("MyWorkTasks").implement({
  description: "What the caller must act on now, grouped and by due (spec: home).",
  fields: (t) => ({
    now: t.field({ type: "DateTime", resolve: (tasks) => tasks.now }),
    timeZone: t.exposeString("timeZone"),
    tasks: t.field({ type: [TaskRef], nullable: true, resolve: (tasks) => tasks.tasks }),
  }),
});

fieldFromOperation({ operation: viewMyTasks, type: MyWorkTasksRef, name: "myWorkTasks" });

const DismissTaskRef = objectFromSchema<MyWorkDismissTaskOutput>({
  name: "MyWorkDismissTaskResult",
  schema: MyWorkDismissTaskOutputSchema,
  description: "The Needs you task the caller dismissed for themselves (ADR 0114).",
});

mutationFromOperation({ operation: dismissMyTask, type: DismissTaskRef });
