import { checkLineHours, type LineHoursCheck, LineHoursCheckOutputSchema } from "@bibi/core";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const LineHoursCheckRef = objectFromSchema<LineHoursCheck>({
  name: "LineHoursCheck",
  schema: LineHoursCheckOutputSchema,
  description: "Whether a planned line falls outside the item's or venue's hours (ADR 0064).",
});

fieldFromOperation({ operation: checkLineHours, type: LineHoursCheckRef, name: "lineHoursCheck" });
