import type { OperationContext } from "../../operations/types";
import type { StatusGates } from "./gate-schema";

export type ReplaceGatesInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  toStatusId: string;
  gates: readonly StatusGates[];
};

/** Replaces every gate on moves into a status (ADR 0076): old rows go, each source and key is added once. */
export async function replaceGates({ context, toStatusId, gates }: ReplaceGatesInput) {
  const { organizationId } = context;
  await context.db.orderStatusGate.deleteMany({ where: { toStatusId } });
  const unique = new Map<
    string,
    { fromStatusId: string | null; key: StatusGates["gates"][number] }
  >();
  for (const { fromStatusId, gates: keys } of gates) {
    for (const key of keys) unique.set(`${fromStatusId ?? ""}|${key}`, { fromStatusId, key });
  }
  const data = [...unique.values()].map((row) => ({ organizationId, toStatusId, ...row }));
  if (data.length > 0) await context.db.orderStatusGate.createMany({ data });
}
