import type { ToolUiEntry } from "./tool-ui-types";
import { uiEntry } from "./ui-entry";
import {
  type SkillCardWire,
  SkillCardWireSchema,
  SkillListWireSchema,
  type SkillRow,
  SkillSearchWireSchema,
} from "./wire-schemas";

/** Props of the skill components. */
export type SkillUiProps = {
  "skill-table": { items: SkillRow[]; nextCursor: string | null };
  "skill-card": { skill: SkillCardWire };
};

const skillCard = uiEntry({
  component: "skill-card",
  schema: SkillCardWireSchema,
  toProps: ({ value }) => ({ skill: value }),
});

/** Tool → component for skills (ADR 0008). */
export const SKILL_UI_ENTRIES: Readonly<Record<string, ToolUiEntry>> = {
  skill_list: uiEntry({
    component: "skill-table",
    schema: SkillListWireSchema,
    toProps: ({ value }) => value,
  }),
  skill_get: skillCard,
  skill_create: skillCard,
  skill_update: skillCard,
  skill_publish: skillCard,
  skill_archive: skillCard,
  skill_share: skillCard,
  skill_import: skillCard,
  load_skill: skillCard,
  skill_search: uiEntry({
    component: "skill-table",
    schema: SkillSearchWireSchema,
    toProps: ({ value }) => ({ items: value.skills, nextCursor: null }),
  }),
};
