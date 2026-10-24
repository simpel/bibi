import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { loadTypeOfBase } from "../entity-type/load-type-of-base";
import { validateFields } from "../field-definition/field-values";
import type { CheckedFields } from "../field-definition/split-links";
import { checkReadable } from "../ticket/ticket-rules";
import { checkTemplateLines } from "./check-template-lines";
import type { TicketTemplateLineInput } from "./schema";

export type CheckTemplateInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  entityTypeId: string;
  statusId: string;
  fields?: Record<string, unknown> | undefined;
  lines: readonly TicketTemplateLineInput[];
};

type StatusInput = Pick<CheckTemplateInput, "context" | "statusId">;

/** The start status is an active status tickets can be created in: never a closing one. */
async function checkStartStatus({ context, statusId }: StatusInput): Promise<Result<true>> {
  const ticketStatus = await context.db.ticketStatus.findFirst({ where: { id: statusId } });
  const message = !ticketStatus
    ? "Unknown status"
    : ticketStatus.closes
      ? "A ticket cannot start in a closing status"
      : null;
  return message
    ? invalid({ message, issues: [{ path: "statusId", message }] })
    : ok({ value: true });
}

/**
 * The checks a template passes on create and on every change: referenced records are readable by
 * the caller (`pipeline:read`, `item:read`), the type is a `TICKET` type, the start status can
 * receive tickets, default field values match the type and the lines point at fitting records.
 * Returns the validated default field values.
 */
export async function checkTemplate({
  context,
  entityTypeId,
  statusId,
  fields,
  lines,
}: CheckTemplateInput): Promise<Result<CheckedFields>> {
  const hasItems = lines.some((line) => line.itemId);
  for (const check of [
    checkReadable({ context, permission: "pipeline:read", path: "statusId" }),
    hasItems
      ? checkReadable({ context, permission: "item:read", path: "lines" })
      : ok({ value: true as const }),
    await loadTypeOfBase({ context, entityTypeId, base: "TICKET" }),
    await checkStartStatus({ context, statusId }),
    await checkTemplateLines({ context, lines }),
  ]) {
    if (!check.ok) return check;
  }
  return validateFields({ context, entityTypeId, values: fields ?? {} });
}
