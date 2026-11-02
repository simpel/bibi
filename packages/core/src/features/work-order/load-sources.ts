import type { Ticket } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { WorkOrderDefinitionDto } from "../work-order-definition/schema";
import { findWorkOrderDefinition } from "../work-order-definition/work-order-definition-rows";

export type Sources = { ticket: Ticket; definition: WorkOrderDefinitionDto };
export type LoadSourcesInput = {
  context: Pick<OperationContext, "db">;
  ticketId: string;
  workOrderDefinitionId: string;
};

/** The ticket and the active definition, or `NOT_FOUND`; the receiving responsibility is active. */
export async function loadSources({
  context,
  ticketId,
  workOrderDefinitionId,
}: LoadSourcesInput): Promise<Result<Sources>> {
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  if (!ticket) return notFound({ entity: "Ticket" });
  const definition = await findWorkOrderDefinition({ context, id: workOrderDefinitionId });
  if (!definition) return notFound({ entity: "Work order definition" });
  const { responsibilityId } = definition;
  if ((await context.db.responsibility.count({ where: { id: responsibilityId } })) === 0) {
    const message = "The work order goes to a responsibility that is archived";
    return invalid({ message, issues: [{ path: "workOrderDefinitionId", message }] });
  }
  return ok({ value: { ticket, definition } });
}
