import type { Ticket } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { findSheetDefinition } from "../sheet-definition/sheet-definition-rows";

export type Sources = { ticket: Ticket; definition: SheetDefinitionDto };
export type LoadSourcesInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  sheetDefinitionId: string;
};

/** The ticket and the active definition, or `NOT_FOUND`; the receiving responsibility is active. */
export async function loadSources({
  context,
  ticketId,
  sheetDefinitionId,
}: LoadSourcesInput): Promise<Result<Sources>> {
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  if (!ticket) return notFound({ entity: "Ticket" });
  const definition = await findSheetDefinition({ context, id: sheetDefinitionId });
  if (!definition) return notFound({ entity: "Sheet definition" });
  const { responsibilityId } = definition;
  if ((await context.db.responsibility.count({ where: { id: responsibilityId } })) === 0) {
    const message = "The sheet goes to a responsibility that is archived";
    return invalid({ message, issues: [{ path: "sheetDefinitionId", message }] });
  }
  return ok({ value: { ticket, definition } });
}
