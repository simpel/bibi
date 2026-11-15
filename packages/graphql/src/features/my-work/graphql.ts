import {
  type MyWork,
  type MyWorkCard,
  MyWorkCardSchema,
  type MyWorkFlag,
  MyWorkFlagSchema,
  viewMyWork,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
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
  }),
});

fieldFromOperation({ operation: viewMyWork, type: MyWorkRef, name: "myWork" });
