import { listVocabularies, getVocabulary } from "./read-operations";
import {
  addVocabularyValue,
  archiveVocabularyValue,
  updateVocabularyValue,
} from "./value-operations";
import {
  archiveVocabulary,
  createVocabulary,
  importVocabularyTemplate,
  updateVocabulary,
} from "./write-operations";

export const vocabularyOperations = [
  listVocabularies,
  getVocabulary,
  createVocabulary,
  updateVocabulary,
  archiveVocabulary,
  importVocabularyTemplate,
  addVocabularyValue,
  updateVocabularyValue,
  archiveVocabularyValue,
];
