import {
  type CalendarBlockDto,
  CalendarBlockSchema,
  type CalendarRange,
  calendarRange,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const CalendarBlockRef = objectFromSchema<CalendarBlockDto>({
  name: "CalendarBlock",
  schema: CalendarBlockSchema,
  description:
    "One block on the calendar: an occupancy of an item joined with its line and ticket.",
});

const CalendarRangeRef = builder.objectRef<CalendarRange>("CalendarRange").implement({
  description: "What is on the calendar between two days, in one time zone.",
  fields: (t) => ({
    timeZone: t.exposeString("timeZone"),
    from: t.field({ type: "DateTime", resolve: (range) => range.from }),
    to: t.field({ type: "DateTime", resolve: (range) => range.to }),
    blocks: t.field({ type: [CalendarBlockRef], resolve: (range) => range.blocks }),
  }),
});

fieldFromOperation({ operation: calendarRange, type: CalendarRangeRef, name: "calendarRange" });
