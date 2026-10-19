import { recordsWithValue } from "../../features/field-definition/field-value-usage";
import { archiveFieldDefinition } from "../../features/field-definition/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoRecordsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0056: archiving a field that records have values for is refused, and the refusal lists the
 * blocking records (the SYSTEM seed actor may read them all). An organization without a used
 * field has nothing to check.
 */
export async function checkDemoRecords({ context, org }: CheckDemoRecordsInput): Promise<string[]> {
  const fields = await context.db.fieldDefinition.findMany({ orderBy: { position: "asc" } });
  for (const field of fields) {
    const usage = await recordsWithValue({ context, field, presence: "has" });
    if (usage.total === 0) continue;
    const input = { id: field.id };
    const result = await execute({ operation: archiveFieldDefinition, input, context });
    if (result.ok) return [`${org.slug}: archiving the used field ${field.name} was allowed`];
    const named = result.error.issues.filter((issue) => issue.path.startsWith("records."));
    if (result.error.code !== "CONFLICT" || named.length !== usage.rows.length) {
      return [`${org.slug}: refusing to archive ${field.name} does not list its records`];
    }
    return [];
  }
  return [];
}
