import { defineOperation } from "../../operations/define-operation";
import { applyChangeSet, CHANGE_SET_OPERATION } from "./apply-change-set";
import { ChangeSetApplyInputSchema, ChangeSetApplyOutputSchema } from "./schema";

export const applyChangeSetOperation = defineOperation({
  name: CHANGE_SET_OPERATION,
  kind: "command",
  description:
    "Make several changes as one (ADR 0049): the commands run in order in one transaction and " +
    "either all are saved or none. Use it whenever one request needs more than one command, " +
    'e.g. create items and then a package of them. A step input may use "$step:<n>.<path>" ' +
    "for the output of an earlier step. Each step needs its own permission and must be a " +
    "command that needs approval; the user confirms the whole set once.",
  input: ChangeSetApplyInputSchema,
  output: ChangeSetApplyOutputSchema,
  permission: "self:edit",
  handler: ({ input, context }) => applyChangeSet({ input, context }),
});

export const changeSetOperations = [applyChangeSetOperation];
