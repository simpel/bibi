import { useTranslations } from "next-intl";
import { type PickRuleText, pickRuleKind } from "./group-pick-rule";

const KEYS = { EXACT: "exact", RANGE: "range", AT_LEAST: "atLeast", AT_MOST: "atMost" } as const;

/** A group's pick rule as the message under it: "Choose 1", "Choose 1–2", "Choose at least 1". */
export function usePickRuleText(): PickRuleText {
  const t = useTranslations("line.pickRule");
  return ({ rule }) => t(KEYS[pickRuleKind({ rule })], { min: rule.min, max: rule.max });
}
