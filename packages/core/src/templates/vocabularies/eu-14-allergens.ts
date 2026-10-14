import type { VocabularyTemplate } from "./vocabulary-template";

/** "EU:s 14 allergener" (Regulation (EU) No 1169/2011, Annex II), in the regulation's order. */
export const euAllergensTemplate: VocabularyTemplate = {
  key: "eu-14-allergens",
  name: "Allergener",
  values: [
    "Gluten",
    "Kräftdjur",
    "Ägg",
    "Fisk",
    "Jordnötter",
    "Soja",
    "Mjölk",
    "Nötter",
    "Selleri",
    "Senap",
    "Sesam",
    "Svaveldioxid/sulfiter",
    "Lupin",
    "Blötdjur",
  ],
};
