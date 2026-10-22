import { cn, TableCell } from "@bibi/ui";
import type { GridCell } from "../calendar-grid-model";
import { BookSlotButton } from "./book-slot-button";
import { CalendarBlockView } from "./calendar-block";

export type CalendarCellProps = {
  cell: GridCell;
  row: number;
  col: number;
  /** Holds the grid's single tab stop (its first block, else its slot button). */
  first: boolean;
  positioned: boolean;
  canBook: boolean;
};

/** One space × time cell: its blocks over the empty-slot button. */
export function CalendarCell({ cell, row, col, first, positioned, canBook }: CalendarCellProps) {
  const firstBlock = first && cell.blocks.length > 0;
  return (
    <TableCell
      className={cn(
        "relative border-r p-0 align-top",
        !positioned && "space-y-1 p-1 pb-8 [&>*]:w-full",
      )}
    >
      {canBook ? (
        <BookSlotButton slot={cell.slot} row={row} col={col} first={first && !firstBlock} />
      ) : null}
      {cell.blocks.map((block, index) => (
        <CalendarBlockView
          key={block.id}
          block={block}
          row={row}
          col={col}
          first={firstBlock && index === 0}
          positioned={positioned}
        />
      ))}
    </TableCell>
  );
}
