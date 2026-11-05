import type { OrderStatusDto } from "@bibi/core/schemas";
import { STATUS_FLAGS, type StatusFlag } from "@bibi/core/schemas";

/** One table row: a status with the names it may move to and the flags it has. */
export type StatusRow = {
  orderStatus: OrderStatusDto;
  index: number;
  /** The chosen targets when the status restricts its moves; empty when it moves freely. */
  targets: string[];
  restrictsNext: boolean;
  closes: boolean;
  flags: StatusFlag[];
};

export type ToStatusRowsInput = { statuses: readonly OrderStatusDto[] };

/** Rows in board order; unknown transition targets fall back to the id. */
export function toStatusRows({ statuses }: ToStatusRowsInput): StatusRow[] {
  return statuses.map((orderStatus, index) => ({
    orderStatus,
    index,
    targets: orderStatus.restrictsNext
      ? orderStatus.transitionsTo.map(
          (id) => statuses.find((target) => target.id === id)?.name ?? id,
        )
      : [],
    restrictsNext: orderStatus.restrictsNext,
    closes: orderStatus.closes,
    flags: STATUS_FLAGS.filter((flag) => orderStatus[flag]),
  }));
}
