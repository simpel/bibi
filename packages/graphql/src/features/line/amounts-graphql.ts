import {
  type LineAmount,
  LineAmountSchema,
  type LineAmounts,
  LineAmountsOutputSchema,
  lineAmounts,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const LineAmountRef = objectFromSchema<LineAmount>({
  name: "LineAmount",
  schema: LineAmountSchema,
  description: "What one priced line costs now, and whether it counts in the total (ADR 0052).",
});

const LineAmountsRef = objectFromSchema<LineAmounts>({
  name: "LineAmounts",
  schema: LineAmountsOutputSchema,
  omit: ["lines"],
  description: "A ticket's line amounts and total, by the draft quote's rules; nothing is written.",
});
builder.objectField(LineAmountsRef, "lines", (t) =>
  t.field({ type: [LineAmountRef], resolve: (amounts) => amounts.lines }),
);

fieldFromOperation({ operation: lineAmounts, type: LineAmountsRef, name: "lineAmounts" });
