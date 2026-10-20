import { ok, type Result } from "../../errors/result";
import { runNested } from "../../operations/run-nested";
import type { AnyOperation, OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { resolveReferences } from "./resolve-references";
import type { ChangeSetApplyInput, ChangeSetApplyOutput, ChangeSetStep } from "./schema";

export const CHANGE_SET_OPERATION = "changeSet.apply";

/** A step must be a command the assistant may propose and that needs approval on its own. */
async function stepOperation({
  step,
  index,
}: {
  step: ChangeSetStep;
  index: number;
}): Promise<Result<AnyOperation>> {
  // Lazy: core-operations lists this operation too, so a static import would be circular.
  const { findStaticOperation } = await import("../../core-operations");
  const operation = findStaticOperation({ name: step.operation });
  const allowed =
    operation?.kind === "command" &&
    operation.approval &&
    operation.aiAllowed &&
    operation.name !== CHANGE_SET_OPERATION;
  if (operation && allowed) return ok({ value: operation });
  const message = `${step.operation} cannot be a step of a change set`;
  return invalid({ message, issues: [{ path: `steps.${index}.operation`, message }] });
}

/** The step's failure with its issues placed under `steps.<n>`, so the card can say which one. */
function failedStep<T>({ result, index }: { result: Result<T> & { ok: false }; index: number }) {
  const { error } = result;
  const issues = error.issues.map((issue) => ({
    ...issue,
    path: `steps.${index}.input.${issue.path}`,
  }));
  return { ok: false as const, error: Object.assign(error, { issues }) };
}

type ApplyInput = { input: ChangeSetApplyInput; context: OperationContext };

/**
 * Runs the steps in order in the caller's transaction (ADR 0049): each one validated and
 * authorized as its own operation, its audit rows named after it. The first failure rolls all
 * of it back.
 */
export async function applyChangeSet({
  input,
  context,
}: ApplyInput): Promise<Result<ChangeSetApplyOutput>> {
  const outputs: unknown[] = [];
  for (const [index, step] of input.steps.entries()) {
    const operation = await stepOperation({ step, index });
    if (!operation.ok) return operation;
    const resolved = resolveReferences({ input: step.input, outputs, step: index });
    if (!resolved.ok) return resolved;
    const recordChange: OperationContext["recordChange"] = ({
      entityType,
      entityId,
      before,
      after,
    }) =>
      context.recordChange({
        operation: operation.value.name,
        entityType,
        entityId,
        before,
        after,
      });
    const result = await runNested({
      operation: operation.value,
      input: resolved.value,
      context: { ...context, recordChange },
    });
    if (!result.ok) return failedStep({ result, index });
    outputs.push(result.value);
  }
  const steps = input.steps.map((step, index) => ({
    operation: step.operation,
    output: outputs[index],
  }));
  return ok({ value: { title: input.title, steps } });
}
