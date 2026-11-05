import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import type { CreateDraftLine } from "./draft-line-schema";
import { draftRows, loadAddOnItemNames } from "./draft-rows";
import { insertDraftLine } from "./insert-draft-line";
import { insertOrder } from "./insert-order";
import { hardCollisions } from "./plan/hard-collisions";
import type { OrderCreateInput, OrderDto } from "./schema";
import { entryStatusId } from "./order-defaults";

export type CreateWithLinesInput = {
  context: OperationContext;
  /** The order's details; its `lines` are ignored in favour of `lines`. */
  input: OrderCreateInput;
  lines: readonly CreateDraftLine[];
  /** The start status: the organization's entry status unless given (`createFromTemplate`). */
  statusId?: string;
  trigger: "MANUAL" | "TEMPLATE";
  /** What the CONFLICT message says cannot be created, e.g. `the order`. */
  subject: string;
};

type StartInput = Pick<CreateWithLinesInput, "context" | "statusId">;

const startStatus = async ({ context, statusId }: StartInput): Promise<Result<string>> =>
  statusId ? ok({ value: statusId }) : await entryStatusId({ context });

/**
 * The one write path of `order.create` and `order.createFromTemplate` (ADR 0081 decisions 9 and
 * 11), inside the command's transaction: the lines are planned against the start status again,
 * and a line whose hard start state would clash returns `CONFLICT` with one issue per blocker at
 * `lines.<index>` (a soft overlap, or a hard clash of a soft line, is prebooked). Then the order,
 * and each line with its options, needs and add-ons (ADR 0088, errors at `lines.<i>.addOns.<j>`). The first failure is returned, so nothing is written.
 */
export async function createWithLines({
  context,
  input,
  lines,
  statusId: given,
  trigger,
  subject,
}: CreateWithLinesInput): Promise<Result<OrderDto>> {
  // Without lines nothing is planned: insertOrder checks the order before it reads the status.
  if (lines.length === 0) return insertOrder({ context, input, statusId: given, trigger });
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
  const order = await insertOrder({ context, input, statusId: statusId.value, trigger });
  if (!order.ok) return order;
  for (const [index, line] of lines.entries()) {
    const made = await insertDraftLine({
      ...{ context, orderId: order.value.id, line, index },
      itemNames,
    });
    if (!made.ok) return made;
  }
  return order;
}
