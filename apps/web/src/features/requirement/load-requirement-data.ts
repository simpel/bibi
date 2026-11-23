import "server-only";
import { type LineDto, listRunSheetDefinitions, type Result } from "@bibi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import { runOperation } from "@/server/run-operation";
import { countedLists } from "./counted-lists";
import type { RequirementFormData } from "./ui/requirement-form-data";

export type LoadRequirementDataInput = {
  lines: LineDto[];
  /** The caller may create types and lists: a missing one gets a link to create it. */
  canSetUp: boolean;
};

/** The lists the active run sheets count; null when the caller may not read them. */
async function loadRunSheetListIds(): Promise<string[] | null> {
  const result = await runOperation({ operation: listRunSheetDefinitions, input: { limit: 100 } });
  if (!result.ok) return null;
  return result.value.items
    .filter((definition) => definition.status === "ACTIVE")
    .flatMap((definition) => definition.vocabularyIds);
}

/**
 * Requirement types and lists (own fields, one page each), the lists a count can be against and
 * the order's lines a count can apply to.
 */
export async function loadRequirementData({
  lines,
  canSetUp,
}: LoadRequirementDataInput): Promise<Result<RequirementFormData>> {
  const [typed, runSheetListIds] = await Promise.all([
    loadTypedFormData({ base: "REQUIREMENT" }),
    loadRunSheetListIds(),
  ]);
  if (!typed.ok) return typed;
  const { vocabularies } = typed.value;
  return {
    ok: true,
    value: {
      ...typed.value,
      lists: countedLists({ vocabularies, runSheetListIds }),
      values: vocabularies.flatMap((list) =>
        list.values.map(({ id, name }) => ({ id, name: `${list.name}: ${name}` })),
      ),
      lines: lines.map(({ id, name }) => ({ id, name })),
      canSetUp,
    },
  };
}
