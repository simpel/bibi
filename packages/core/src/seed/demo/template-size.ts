import {
  getVocabularyTemplate,
  type VocabularyTemplateKey,
} from "../../templates/vocabularies/vocabulary-templates";

export type GetTemplateListSizeInput = { key: VocabularyTemplateKey };

/** Number of values an imported list template creates. */
export const getTemplateListSize = ({ key }: GetTemplateListSizeInput) =>
  getVocabularyTemplate({ key }).values.length;
