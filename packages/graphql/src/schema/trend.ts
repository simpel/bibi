import { type Trend, type TrendPoint, TrendPointSchema } from "@bibi/core";
import { builder, type ObjectRefOf } from "./builder";
import { objectFromSchema } from "./object-from-schema";

const TrendPointRef = objectFromSchema<TrendPoint>({
  name: "TrendPoint",
  schema: TrendPointSchema,
  description: "One bucket of a trend line.",
});

/** A headline figure over a range with its line and the previous range's value (ADR 0086). */
export const TrendRef: ObjectRefOf<Trend> = builder.objectRef<Trend>("Trend").implement({
  description: "A figure over a range: its line, its value and the previous range's value.",
  fields: (t) => ({
    series: t.field({ type: [TrendPointRef], resolve: (trend) => trend.series }),
    current: t.exposeFloat("current"),
    previous: t.exposeFloat("previous", { nullable: true }),
  }),
});
