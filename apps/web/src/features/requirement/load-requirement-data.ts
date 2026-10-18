import "server-only";
import type { ProgramItemDto, Result } from "@okazi/core";
import { loadTypedFormData } from "@/server/load-typed-form-data";
import type { RequirementFormData } from "./ui/requirement-form-data";

export type LoadRequirementDataInput = { programItems: ProgramItemDto[] };

/**
 * Requirement types and lists (own fields and the values to count, one page each) and the
 * ticket's program items a count can apply to.
 */
export async function loadRequirementData({
  programItems,
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
      programItems: programItems.map(({ id, name }) => ({ id, name })),
    },
  };
}
