import { conferenceEstatePhaseGrid } from "./conference-estate";
import { defaultPhaseGrid } from "./default";
import type { PhaseGridTemplate } from "./phase-grid-template";

export const PHASE_GRID_TEMPLATE_KEYS = ["default", "conference-estate"] as const;
export type PhaseGridTemplateKey = (typeof PHASE_GRID_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<PhaseGridTemplateKey, PhaseGridTemplate> = {
  default: defaultPhaseGrid,
  "conference-estate": conferenceEstatePhaseGrid,
};

export type GetPhaseGridTemplateInput = { key: PhaseGridTemplateKey };

export function getPhaseGridTemplate({ key }: GetPhaseGridTemplateInput): PhaseGridTemplate {
  return TEMPLATES[key];
}
