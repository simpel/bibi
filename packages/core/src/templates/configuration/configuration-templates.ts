import { conferenceVenueConfiguration } from "./conference-venue";
import type { ConfigurationTemplate } from "./configuration-template";

export const CONFIGURATION_TEMPLATE_KEYS = ["conference-venue"] as const;
export type ConfigurationTemplateKey = (typeof CONFIGURATION_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<ConfigurationTemplateKey, ConfigurationTemplate> = {
  "conference-venue": conferenceVenueConfiguration,
};

export type GetConfigurationTemplateInput = { key: ConfigurationTemplateKey };

export function getConfigurationTemplate({
  key,
}: GetConfigurationTemplateInput): ConfigurationTemplate {
  return TEMPLATES[key];
}
