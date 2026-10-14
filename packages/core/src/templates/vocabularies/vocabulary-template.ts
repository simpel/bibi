/** A list an organization can import and then edit freely (ADR 0021). Data, not code. */
export type VocabularyTemplate = {
  key: string;
  /** Name of the list the import creates, e.g. "Allergens". */
  name: string;
  values: readonly string[];
};
