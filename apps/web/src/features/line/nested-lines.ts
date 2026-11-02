import { type LineDto, nestUnderParents } from "@bibi/core";

/** Sub-lines (parts, options, add-ons) right under their line (ADR 0059, 0088). */
export const nestedLines = ({ lines }: { lines: LineDto[] }) =>
  nestUnderParents({ rows: lines, keys: (line) => ({ id: line.id, parentId: line.parentLineId }) });
