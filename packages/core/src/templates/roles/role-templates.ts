import { conferenceVenueTemplate } from "./conference-venue";
import type { RoleTemplate } from "./role-template";

export const ROLE_TEMPLATE_KEYS = ["conference-venue"] as const;
export type RoleTemplateKey = (typeof ROLE_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<RoleTemplateKey, RoleTemplate> = {
  "conference-venue": conferenceVenueTemplate,
};

export type GetRoleTemplateInput = { key: RoleTemplateKey };

export function getRoleTemplate({ key }: GetRoleTemplateInput): RoleTemplate {
  return TEMPLATES[key];
}
