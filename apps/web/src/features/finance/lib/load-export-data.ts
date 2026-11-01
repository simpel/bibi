import "server-only";
import { listAccountingExports } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

/** What the export history needs: the latest 50 exports. */
export function loadExportData() {
  return runOperation({ operation: listAccountingExports, input: { limit: 50 } });
}
