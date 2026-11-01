import "server-only";
import { listAccountingExports, previewAccountingExport } from "@bibi/core";
import { runOperation } from "@/server/run-operation";

/** What the export button and the history need: the pending preview and the latest 50 exports. */
export async function loadExportData() {
  const [preview, exports] = await Promise.all([
    runOperation({ operation: previewAccountingExport, input: {} }),
    runOperation({ operation: listAccountingExports, input: { limit: 50 } }),
  ]);
  return { preview, exports };
}
