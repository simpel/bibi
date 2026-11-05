import {
  type PlanIssue,
  PlanIssueSchema,
  type PlanLineIssue,
  PlanLineIssueSchema,
  type PreviewEntry,
  PreviewEntrySchema,
  type PreviewLine,
  PreviewLineSchema,
  previewOrderLines,
  type OrderPreviewLines,
  OrderPreviewLinesOutputSchema,
} from "@bibi/core";
import { builder } from "../../schema/builder";
import { fieldFromOperation } from "../../schema/from-operation";
import { objectFromSchema } from "../../schema/object-from-schema";

const LineIssueRef = objectFromSchema<PlanLineIssue>({
  name: "PlanLineIssue",
  schema: PlanLineIssueSchema,
  description: "One issue of a planned line (ADR 0081); fields of other kinds are null.",
});

const PlanIssueRef = objectFromSchema<PlanIssue>({
  name: "PlanIssue",
  schema: PlanIssueSchema,
  description: "An issue of a whole package or draft: guest range or requested end.",
});

const LineRef = objectFromSchema<PreviewLine>({
  name: "PreviewLine",
  schema: PreviewLineSchema,
  omit: ["issues"],
  description: "A planned line: effective values, start state and issues. Nothing is saved.",
});
builder.objectField(LineRef, "issues", (t) =>
  t.field({ type: [LineIssueRef], resolve: (line) => line.issues }),
);

const EntryRef = objectFromSchema<PreviewEntry>({
  name: "PreviewEntry",
  schema: PreviewEntrySchema,
  omit: ["issues", "lines"],
  description: "One package, or the draft lines, planned for the requested period.",
});
builder.objectFields(EntryRef, (t) => ({
  issues: t.field({ type: [PlanIssueRef], resolve: (entry) => entry.issues }),
  lines: t.field({ type: [LineRef], resolve: (entry) => entry.lines }),
}));

const PreviewRef = objectFromSchema<OrderPreviewLines>({
  name: "OrderPreviewLines",
  schema: OrderPreviewLinesOutputSchema,
  omit: ["entries"],
  description: "The order intake preview (ADR 0081); nothing is written.",
});
builder.objectField(PreviewRef, "entries", (t) =>
  t.field({ type: [EntryRef], resolve: (preview) => preview.entries }),
);

fieldFromOperation({ operation: previewOrderLines, type: PreviewRef, name: "orderPreviewLines" });
