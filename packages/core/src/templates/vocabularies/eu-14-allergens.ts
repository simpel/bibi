import type { VocabularyTemplate } from "./vocabulary-template";

/** "EU 14 allergens" (Regulation (EU) No 1169/2011, Annex II), in the regulation's order. */
export const euAllergensTemplate: VocabularyTemplate = {
  key: "eu-14-allergens",
  name: "Allergens",
  values: [
    "Gluten",
    "Crustaceans",
    "Eggs",
    "Fish",
    "Peanuts",
    "Soy",
    "Milk",
    "Tree nuts",
    "Celery",
    "Mustard",
    "Sesame",
    "Sulphur dioxide/sulphites",
    "Lupin",
    "Molluscs",
  ],
};
