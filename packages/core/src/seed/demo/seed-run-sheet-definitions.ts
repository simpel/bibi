import { ok, type Result } from "../../errors/result";
import { createRunSheetDefinition } from "../../features/run-sheet-definition/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoRefs } from "./demo-refs";
import { resolveNames } from "./resolve-names";
import type { DemoOrg } from "./types";

export type SeedDemoRunSheetDefinitionsInput = {
  context: ExecuteContext;
  org: DemoOrg;
  refs: DemoRefs;
  /** Responsibility name → id, as just created. */
  responsibilityIds: ReadonlyMap<string, string>;
};

/**
 * The run sheet definitions (ADR 0092) via `runSheetDefinition.create` as SYSTEM, before any
 * order: the orders' line and need commands then generate each run sheet's versions.
 */
export async function seedDemoRunSheetDefinitions({
  context,
  org,
  refs,
  responsibilityIds,
}: SeedDemoRunSheetDefinitionsInput): Promise<Result<true>> {
  const typeIds = new Map([...refs.itemTypes].map(([name, type]) => [name, type.id]));
  const listIds = new Map([...refs.lists].map(([name, list]) => [name, list.id]));
  for (const { name, types, lists, responsibility } of org.runSheets) {
    const entityTypeIds = resolveNames({ kind: "item type", names: types, ids: typeIds });
    if (!entityTypeIds.ok) return entityTypeIds;
    const vocabularyIds = resolveNames({ kind: "list", names: lists, ids: listIds });
    if (!vocabularyIds.ok) return vocabularyIds;
    const receiver = resolveNames({
      kind: "responsibility",
      names: [responsibility],
      ids: responsibilityIds,
    });
    if (!receiver.ok) return receiver;
    const [responsibilityId = ""] = receiver.value;
    const input = {
      name,
      entityTypeIds: entityTypeIds.value,
      vocabularyIds: vocabularyIds.value,
      responsibilityId,
    };
    const result = await execute({ operation: createRunSheetDefinition, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
