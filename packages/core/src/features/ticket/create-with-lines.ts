import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { CreateDraftLine } from "./draft-line-schema";
import { draftRows, loadAddOnItemNames } from "./draft-rows";
import { insertDraftLine } from "./insert-draft-line";
import { insertTicket } from "./insert-ticket";
import { hardCollisions } from "./plan/hard-collisions";
import type { TicketCreateInput, TicketDto } from "./schema";
import { entryStatusId } from "./ticket-defaults";

export type CreateWithLinesInput = {
  context: OperationContext;
  /** The ticket's details; its `lines` are ignored in favour of `lines`. */
  input: TicketCreateInput;
  lines: readonly CreateDraftLine[];
  /** The start status: the organization's entry status unless given (`createFromTemplate`). */
  statusId?: string;
  trigger: "MANUAL" | "TEMPLATE";
  /** What the CONFLICT message says cannot be created, e.g. `the ticket`. */
  subject: string;
};

type StartInput = Pick<CreateWithLinesInput, "context" | "statusId">;

const startStatus = async ({ context, statusId }: StartInput): Promise<Result<string>> =>
  statusId ? ok({ value: statusId }) : await entryStatusId({ context });

/**
 * The one write path of `ticket.create` and `ticket.createFromTemplate` (ADR 0081 decisions 9 and
 * 11), inside the command's transaction: the lines are planned against the start status again,
 * and a line whose hard start state would clash returns `CONFLICT` with one issue per blocker at
 * `lines.<index>` (a soft overlap, or a hard clash of a soft line, is prebooked). Then the ticket,
 * and each line with its options, needs and add-ons (ADR 0088, errors at `lines.<i>.addOns.<j>`). The first failure is returned, so nothing is written.
 */
export async function createWithLines({
  context,
  input,
  lines,
  statusId: given,
  trigger,
  subject,
}: CreateWithLinesInput): Promise<Result<TicketDto>> {
  // Without lines nothing is planned: insertTicket checks the ticket before it reads the status.
  if (lines.length === 0) return insertTicket({ context, input, statusId: given, trigger });
  const statusId = await startStatus({ context, statusId: given });
  if (!statusId.ok) return statusId;
  const itemNames = await loadAddOnItemNames({ context, lines });
  const rows = draftRows({ lines, itemNames });
  const blockers = await hardCollisions({
    ...{ context, statusId: statusId.value },
    ...{ lines: rows.map((row) => row.line), paths: rows.map((row) => row.path) },
  });
  if (blockers.length > 0) {
    const message = `Cannot create ${subject}: ${blockers.length} line(s) are blocked`;
    return conflict({ message, issues: blockers });
  }
  const ticket = await insertTicket({ context, input, statusId: statusId.value, trigger });
  if (!ticket.ok) return ticket;
  for (const [index, line] of lines.entries()) {
    const made = await insertDraftLine({
      ...{ context, ticketId: ticket.value.id, line, index },
      itemNames,
    });
    if (!made.ok) return made;
  }
  return ticket;
}
