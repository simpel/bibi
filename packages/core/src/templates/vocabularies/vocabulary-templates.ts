import { euAllergensTemplate } from "./eu-14-allergens";
import type { VocabularyTemplate } from "./vocabulary-template";

export const VOCABULARY_TEMPLATE_KEYS = ["eu-14-allergens"] as const;
export type VocabularyTemplateKey = (typeof VOCABULARY_TEMPLATE_KEYS)[number];

const TEMPLATES: Record<VocabularyTemplateKey, VocabularyTemplate> = {
  "eu-14-allergens": euAllergensTemplate,
};

export type GetVocabularyTemplateInput = { key: VocabularyTemplateKey };

export function getVocabularyTemplate({ key }: GetVocabularyTemplateInput): VocabularyTemplate {
  return TEMPLATES[key];
}
