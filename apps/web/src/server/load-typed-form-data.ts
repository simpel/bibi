import "server-only";
import { listVocabularies, type Result } from "@bibi/core";
import { cache } from "react";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { loadEntityTypesOf } from "./load-entity-types";
import { loadLinkTargets } from "./load-link-targets";
import { runOperation } from "./run-operation";

const LIMIT = 100;

export type LoadTypedFormDataInput = {
  base: "CUSTOMER" | "CONTACT" | "ORDER" | "LINE" | "REQUIREMENT";
};

const loadVocabulariesCached = cache(async () => {
  return runOperation({ operation: listVocabularies, input: { limit: LIMIT } });
});

const loadTypedFormDataCached = cache(
  async (base: LoadTypedFormDataInput["base"]): Promise<Result<TypedFormData>> => {
    const [types, vocabularies] = await Promise.all([
      loadEntityTypesOf({ base }),
      loadVocabulariesCached(),
    ]);
    if (!types.ok) return types;
    if (!vocabularies.ok) return vocabularies;
    const links = await loadLinkTargets({ types: types.value.items });
    return {
      ok: true,
      value: { types: types.value.items, vocabularies: vocabularies.value.items, links },
    };
  },
);

/** The base's types (with their fields), the lists their choice fields use and link targets. */
export function loadTypedFormData({
  base,
}: LoadTypedFormDataInput): Promise<Result<TypedFormData>> {
  return loadTypedFormDataCached(base);
}
