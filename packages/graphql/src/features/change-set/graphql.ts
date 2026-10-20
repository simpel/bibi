import { applyChangeSetOperation, type ChangeSetApplyOutput } from "@okazi/core";
import { builder } from "../../schema/builder";
import { mutationFromOperation } from "../../schema/from-operation";

type StepResult = ChangeSetApplyOutput["steps"][number];

const StepResultRef = builder.objectRef<StepResult>("ChangeSetStepResult");
StepResultRef.implement({
  description: "One step of an applied change set: its operation and its own result.",
  fields: (t) => ({
    operation: t.exposeString("operation"),
    output: t.field({ type: "JSON", nullable: true, resolve: (step) => step.output }),
  }),
});

const ChangeSetRef = builder.objectRef<ChangeSetApplyOutput>("ChangeSet");
ChangeSetRef.implement({
  description: "Several changes applied as one (ADR 0049).",
  fields: (t) => ({
    title: t.exposeString("title"),
    steps: t.field({ type: [StepResultRef], resolve: (set) => set.steps }),
  }),
});

mutationFromOperation({ operation: applyChangeSetOperation, type: ChangeSetRef });
