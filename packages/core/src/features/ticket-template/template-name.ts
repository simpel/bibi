import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

/** The name is unique among the active templates (a partial unique index backs it up). */
export async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.ticketTemplate.findFirst({ where: { name } });
  if (!found || found.id === id) return null;
  const message = `A predefined ticket named "${name}" exists`;
  return conflict({ message, issues: [{ path: "name", message }] });
}
