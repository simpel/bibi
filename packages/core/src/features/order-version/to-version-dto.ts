import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import type { OrderContent } from "./content";
import { diffContent } from "./diff";
import type { VersionRow } from "./load-versions";
import type { OrderVersionDetail, OrderVersionDto, VersionLine } from "./schema";

export type ToVersionDtoInput = {
  context: Pick<OperationContext, "permissions">;
  row: VersionRow;
  lines: readonly VersionLine[];
  now: OrderContent;
};

/** A version with its changes against the order now; its quotes only with `quote:read`. */
export function toVersionDetail({ context, row, lines, now }: ToVersionDtoInput) {
  const { contentHash, restoredFrom, quotes, ...rest } = row;
  const changes = diffContent({ version: { ...row, lines }, now });
  const detail: OrderVersionDetail = {
    ...rest,
    restoredFromNumber: restoredFrom?.number ?? null,
    lineCount: lines.length,
    isCurrent: contentHash === now.hash,
    changeCount: changes.count,
    quotes: canView({ context, feature: "quote" }) ? quotes : [],
    lines: [...lines],
    changes,
  };
  return detail;
}

/** The list form: the detail without its lines and changes. */
export function toVersionDto({ context, row, lines, now }: ToVersionDtoInput): OrderVersionDto {
  const {
    lines: _lines,
    changes: _changes,
    ...dto
  } = toVersionDetail({ context, row, lines, now });
  return dto;
}
