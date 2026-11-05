import "server-only";
import { getRunSheetDefinition, type Result, type RunSheetDefinitionDto } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

type Loaded = Result<RunSheetDefinitionDto>;

const loadRunSheetDefinitionCached = cache(async (id: string): Promise<Loaded> => {
  return runOperation({ operation: getRunSheetDefinition, input: { id } });
});

export type LoadRunSheetDefinitionInput = { id: string };

/** The run sheet definition by its id, cached per request so metadata and page components share one read. */
export function loadRunSheetDefinition({ id }: LoadRunSheetDefinitionInput): Promise<Loaded> {
  return loadRunSheetDefinitionCached(id);
}
