import "server-only";
import {
  type FieldDefinitionDto,
  getRunSheetDefinition,
  listRunSheets,
  ok,
  type Result,
  type RunSheetDefinitionDto,
  type RunSheetDto,
} from "@bibi/core";
import { loadEntityTypesOf } from "@/server/load-entity-types";
import { runOperation } from "@/server/run-operation";
import type { RunSheetFieldColumn } from "./ui/use-run-sheet-task-columns";

export type RunSheetViewData = {
  runSheet: RunSheetDto;
  /** The definition's name; null when the caller may not read the configuration. */
  name: string | null;
  /** The included fields in the definition's order, named when the item types are readable. */
  fields: RunSheetFieldColumn[];
  /** Every version of the same order and definition, newest first. */
  versions: RunSheetDto[];
};

const LIMIT = 100;

/** Field keys the rows carry, when the definition or the types cannot be read. */
const keysOf = ({ runSheet }: { runSheet: RunSheetDto }): RunSheetFieldColumn[] =>
  [
    ...new Set(
      runSheet.content.rows.flatMap((row) => (row.kind === "ITEM" ? Object.keys(row.values) : [])),
    ),
  ].map((key) => ({ key, name: key }));

type Lookups = {
  definitions: Map<string, RunSheetDefinitionDto>;
  fields: Map<string, FieldDefinitionDto> | null;
};

/** Each distinct definition once, and the item types' fields once, for any number of versions. */
async function loadLookups({ runSheets }: { runSheets: RunSheetDto[] }): Promise<Lookups> {
  const ids = [...new Set(runSheets.map((runSheet) => runSheet.runSheetDefinitionId))];
  const [found, types] = await Promise.all([
    Promise.all(ids.map((id) => runOperation({ operation: getRunSheetDefinition, input: { id } }))),
    loadEntityTypesOf({ base: "ITEM" }),
  ]);
  const definitions = new Map(
    found.flatMap((result) => (result.ok ? [[result.value.id, result.value]] : [])),
  );
  const fields = types.ok
    ? new Map(types.value.items.flatMap((type) => type.fields).map((field) => [field.id, field]))
    : null;
  return { definitions, fields };
}

type FieldsForInput = { runSheet: RunSheetDto; lookups: Lookups };

function fieldsFor({ runSheet, lookups }: FieldsForInput): RunSheetFieldColumn[] {
  const definition = lookups.definitions.get(runSheet.runSheetDefinitionId);
  const { fields } = lookups;
  if (!definition || !fields) return keysOf({ runSheet });
  return definition.fieldIds.flatMap((fieldId) => {
    const field = fields.get(fieldId);
    return field ? [{ key: field.key, name: field.name }] : [];
  });
}

/** The versions of the run sheet's order and definition, newest first. */
async function versionsOf({ runSheet }: { runSheet: RunSheetDto }) {
  const { orderId, runSheetDefinitionId } = runSheet;
  const input = { orderId, runSheetDefinitionId, sort: "version" as const, limit: LIMIT };
  const result = await runOperation({ operation: listRunSheets, input });
  return result.ok ? result.value.items : [runSheet];
}

/**
 * What `RunSheetView` shows for each version: its definition's name and fields and its sibling
 * versions. Shared lookups load once, so Today renders many run sheets without N+1 lookups.
 */
export async function loadRunSheetViews({
  runSheets,
}: {
  runSheets: RunSheetDto[];
}): Promise<Result<RunSheetViewData[]>> {
  const [lookups, versions] = await Promise.all([
    loadLookups({ runSheets }),
    Promise.all(runSheets.map((runSheet) => versionsOf({ runSheet }))),
  ]);
  const views = runSheets.map((runSheet, index) => ({
    runSheet,
    name: lookups.definitions.get(runSheet.runSheetDefinitionId)?.name ?? null,
    fields: fieldsFor({ runSheet, lookups }),
    versions: versions[index] ?? [runSheet],
  }));
  return ok({ value: views });
}
