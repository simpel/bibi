import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import { checkReadable } from "../ticket/ticket-rules";
import { checkTemplateLines } from "./check-template-lines";
import type { TicketTemplateLineInput } from "./schema";

export type CheckTemplateInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  entityTypeId: string;
  phaseId: string;
  fields?: Record<string, unknown> | undefined;
  lines: readonly TicketTemplateLineInput[];
};

type PhaseInput = Pick<CheckTemplateInput, "context" | "phaseId">;

/** The start phase is an active phase tickets can be created in: never a terminal one. */
async function checkStartPhase({ context, phaseId }: PhaseInput): Promise<Result<true>> {
  const phase = await context.db.ticketPhase.findFirst({ where: { id: phaseId } });
  const message = !phase
    ? "Unknown phase"
    : phase.terminal
      ? "A ticket cannot start in a terminal phase"
      : null;
  return message
    ? invalid({ message, issues: [{ path: "phaseId", message }] })
    : ok({ value: true });
}

/**
 * The checks a template passes on create and on every change: referenced records are readable by
 * the caller (`pipeline:read`, `item:read`), the type is a `TICKET` type, the start phase can
 * receive tickets, default field values match the type and the lines point at fitting records.
 * Returns the validated default field values.
 */
export async function checkTemplate({
  context,
  entityTypeId,
  phaseId,
  fields,
  lines,
}: CheckTemplateInput): Promise<Result<Record<string, unknown>>> {
  const hasItems = lines.some((line) => line.itemId);
  for (const check of [
    checkReadable({ context, permission: "pipeline:read", path: "phaseId" }),
    hasItems
      ? checkReadable({ context, permission: "item:read", path: "lines" })
      : ok({ value: true as const }),
    await loadTypeOfBase({ context, entityTypeId, base: "TICKET" }),
    await checkStartPhase({ context, phaseId }),
    await checkTemplateLines({ context, lines }),
  ]) {
    if (!check.ok) return check;
  }
  return validateFields({ context, entityTypeId, values: fields ?? {} });
}
