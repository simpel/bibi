import { conferenceEstateStatusGrid } from "./conference-estate";
import { defaultStatusGrid } from "./default";
import type { StatusGridTemplate } from "./status-grid-template";

export const STATUS_GRID_TEMPLATE_KEYS = ["default", "conference-estate"] as const;
export type StatusGridTemplateKey = (typeof STATUS_GRID_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<StatusGridTemplateKey, StatusGridTemplate> = {
  default: defaultStatusGrid,
  "conference-estate": conferenceEstateStatusGrid,
};

export type GetStatusGridTemplateInput = { key: StatusGridTemplateKey };

export function getStatusGridTemplate({ key }: GetStatusGridTemplateInput): StatusGridTemplate {
  return TEMPLATES[key];
}
