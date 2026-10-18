import type { Ticket } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { isFixedRole } from "../../permissions/fixed-roles";
import { invalid, notFound } from "../../shared/errors";
import type { SheetDefinitionDto } from "../sheet-definition/schema";

export type Sources = { ticket: Ticket; definition: SheetDefinitionDto };
export type LoadSourcesInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  sheetDefinitionId: string;
};

/** The ticket and the active definition, or `NOT_FOUND`; the receiving role must be a fixed role. */
export async function loadSources({
  context,
  ticketId,
  sheetDefinitionId,
}: LoadSourcesInput): Promise<Result<Sources>> {
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  if (!ticket) return notFound({ entity: "Ticket" });
  const definition = await context.db.sheetDefinition.findFirst({
    where: { id: sheetDefinitionId },
  });
  if (!definition) return notFound({ entity: "Sheet definition" });
  if (!isFixedRole({ role: definition.roleId })) {
    const message = `The sheet goes to a role that does not exist (${definition.roleId})`;
    return invalid({ message, issues: [{ path: "sheetDefinitionId", message }] });
  }
  return ok({ value: { ticket, definition } });
}
