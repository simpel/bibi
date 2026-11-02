import { z } from "zod";
import type { ChooseOptionsFormValues } from "./choose-options-schema";
import { groupPickIssues, type PickRuleText } from "./group-pick-rule";
import type { CustomisableItem } from "./program-form-data";

export type GroupRulesInput<V, S extends z.ZodType<unknown, V>> = {
  /** The form's schema over raw values (`formSchema(...)`), run once the groups pass. */
  schema: S;
  groups: CustomisableItem["groups"];
  /** The options the raw values choose (`chosenOptionsOf`). */
  chosen: (input: { values: V }) => readonly { itemId: string }[];
  skipWhenNone: boolean;
  ruleText: PickRuleText;
};

/**
 * The groups' min/max pick rule (`groupPickIssues`) before the form's own schema: an issue at
 * `groups.<n>.picked` (or `.quantities` in a split group) under the group, so Save waits for it.
 */
export function withGroupRules<V extends ChooseOptionsFormValues, S extends z.ZodType<unknown, V>>({
  schema,
  groups,
  chosen,
  skipWhenNone,
  ruleText,
}: GroupRulesInput<V, S>) {
  return z
    .custom<V>()
    .superRefine((values, context) => {
      const picks = chosen({ values });
      for (const issue of groupPickIssues({ groups, chosen: picks, skipWhenNone })) {
        context.addIssue({
          code: "custom",
          path: ["groups", issue.index, issue.field],
          message: ruleText({ rule: issue.rule }),
        });
      }
    })
    .pipe(schema);
}
