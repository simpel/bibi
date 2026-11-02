import {
  type LineIssue,
  LineIssueSchema,
  type LineIssues,
  LineIssuesOutputSchema,
  LineWithIssuesSchema,
  lineIssues,
} from "@bibi/core";
import type { z } from "zod";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

type LineWithIssues = z.infer<typeof LineWithIssuesSchema>;

const LineIssueRef = objectFromSchema<LineIssue>({
  name: "LineIssue",
  schema: LineIssueSchema,
  description: "One issue of a saved line (ADR 0081); fields of other kinds are null.",
});

const LineWithIssuesRef = objectFromSchema<LineWithIssues>({
  name: "LineWithIssues",
  schema: LineWithIssuesSchema,
  omit: ["issues"],
  description: "A saved line and what stands in its way or warns about it.",
});
builder.objectField(LineWithIssuesRef, "issues", (t) =>
  t.field({ type: [LineIssueRef], resolve: (line) => line.issues }),
);

const LineIssuesRef = objectFromSchema<LineIssues>({
  name: "LineIssues",
  schema: LineIssuesOutputSchema,
  omit: ["lines"],
  description: "A saved ticket's lines with issues; nothing is written.",
});
builder.objectField(LineIssuesRef, "lines", (t) =>
  t.field({ type: [LineWithIssuesRef], resolve: (issues) => issues.lines }),
);

fieldFromOperation({ operation: lineIssues, type: LineIssuesRef, name: "lineIssues" });
