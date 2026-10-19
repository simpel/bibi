import { z } from "zod";

export const CHANGE_SET_MAX_STEPS = 20;

/** `"$step:<n>.<path>"`: the value at `path` in the output of the earlier step `n`. */
export const STEP_REFERENCE = /^\$step:(\d+)\.([A-Za-z0-9_.]+)$/;

export const ChangeSetStepSchema = z.object({
  operation: z
    .string()
    .min(1)
    .max(100)
    .describe("A command that needs approval, by name, e.g. item.create or item.update"),
  input: z
    .record(z.string(), z.unknown())
    .describe(
      'The command\'s own input. A value may be "$step:<n>.<path>" to use the output of an ' +
        'earlier step, e.g. "$step:0.id" for the id of what step 0 created',
    ),
});

/** Input of `changeSet.apply` (ADR 0049): several commands as one change, all or nothing. */
export const ChangeSetApplyInputSchema = z.object({
  title: z.string().trim().min(1).max(120).describe("What the change does, in the user's words"),
  steps: z.array(ChangeSetStepSchema).min(1).max(CHANGE_SET_MAX_STEPS).describe("In order"),
});

export const ChangeSetStepResultSchema = z.object({
  operation: z.string(),
  output: z.unknown().describe("The step's own result"),
});

export const ChangeSetApplyOutputSchema = z.object({
  title: z.string(),
  steps: z.array(ChangeSetStepResultSchema),
});

export type ChangeSetStep = z.infer<typeof ChangeSetStepSchema>;
export type ChangeSetApplyInput = z.infer<typeof ChangeSetApplyInputSchema>;
export type ChangeSetApplyOutput = z.infer<typeof ChangeSetApplyOutputSchema>;
