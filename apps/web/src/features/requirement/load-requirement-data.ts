import "server-only";
import type { LineDto, Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import type { RequirementFormData } from "./ui/requirement-form-data";

export type LoadRequirementDataInput = { lines: LineDto[] };

/**
 * Requirement types and lists (own fields and the values to count, one page each) and the
 * ticket's lines a count can apply to.
 */
export async function loadRequirementData({
  lines,
}: LoadRequirementDataInput): Promise<Result<RequirementFormData>> {
  const typed = await loadTypedFormData({ base: "REQUIREMENT" });
  if (!typed.ok) return typed;
  const values = typed.value.vocabularies.flatMap((list) =>
    list.values.map(({ id, name }) => ({ id, name: `${list.name}: ${name}` })),
  );
  return {
    ok: true,
    value: {
      ...typed.value,
      values,
      lines: lines.map(({ id, name }) => ({ id, name })),
    },
  };
}
