import "server-only";
import { listEntityTypes, listVocabularies, type Result } from "@okazi/core";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { loadLinkTargets } from "./load-link-targets";
import { runOperation } from "./run-operation";

const LIMIT = 100;

export type LoadTypedFormDataInput = {
  base: "CUSTOMER" | "CONTACT" | "BOOKING" | "PROGRAM_ITEM" | "INQUIRY";
};

/** The base's types (with their fields), the lists their choice fields use and link targets. */
export async function loadTypedFormData({
  base,
}: LoadTypedFormDataInput): Promise<Result<TypedFormData>> {
  const [types, vocabularies] = await Promise.all([
    runOperation({ operation: listEntityTypes, input: { base, limit: LIMIT } }),
    runOperation({ operation: listVocabularies, input: { limit: LIMIT } }),
  ]);
  if (!types.ok) return types;
  if (!vocabularies.ok) return vocabularies;
  const links = await loadLinkTargets({ types: types.value.items });
  return {
    ok: true,
    value: { types: types.value.items, vocabularies: vocabularies.value.items, links },
  };
}
