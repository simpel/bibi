"use client";

import { Table, TableBody, TableCaption, TableHead, TableHeader, TableRow } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { GridModel } from "../calendar-grid-model";
import { LANE_REM } from "./calendar-block";
import { CalendarCell } from "./calendar-cell";
import { onGridKeyDown } from "./grid-keys";

export type CalendarGridProps = { model: GridModel; canBook: boolean };

/** Hour columns are narrow so a whole day fits; the table scrolls sideways inside its frame. */
const COLUMN_CLASS = { day: "w-16 min-w-16", week: "min-w-32" } as const;

/** Row and column of the cell that holds the grid's one tab stop. */
function tabStop({ model, canBook }: CalendarGridProps) {
  for (const [row, { cells }] of model.rows.entries()) {
    const col = cells.findIndex((cell) => canBook || cell.blocks.length > 0);
    if (col !== -1) return { row, col };
  }
  return { row: -1, col: -1 };
}

type HeaderRowProps = { model: GridModel; spacesLabel: string };

function HeaderRow({ model, spacesLabel }: HeaderRowProps) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        <TableHead scope="col" className="sticky left-0 z-20 w-48 min-w-48 border-r bg-background">
          {spacesLabel}
        </TableHead>
        {model.columns.map((column) => (
          <TableHead
            key={column.key}
            scope="col"
            className={`${COLUMN_CLASS[model.view]} border-r px-2 text-xs`}
          >
            {column.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

/** Spaces as rows, hours (day) or days (week) as columns; arrow keys move between cells. */
export function CalendarGrid({ model, canBook }: CalendarGridProps) {
  const t = useTranslations("calendar");
  const stop = tabStop({ model, canBook });
  const positioned = model.view === "day";
  return (
    <div className="hidden rounded-md border md:block">
      <Table className="table-fixed" onKeyDown={(event) => onGridKeyDown({ event })}>
        <TableCaption className="sr-only">
          {t("gridLabel")}. {t("keyboardHint")}
        </TableCaption>
        <HeaderRow model={model} spacesLabel={t("spaces")} />
        <TableBody>
          {model.rows.map((row, rowIndex) => (
            <TableRow
              key={row.id}
              className="hover:bg-transparent"
              style={positioned ? { height: `${row.lanes * LANE_REM + 0.5}rem` } : undefined}
            >
              <TableHead scope="row" className="sticky left-0 z-20 truncate border-r bg-background">
                {row.name}
              </TableHead>
              {row.cells.map((cell, col) => (
                <CalendarCell
                  key={cell.key}
                  cell={cell}
                  row={rowIndex}
                  col={col}
                  first={stop.row === rowIndex && stop.col === col}
                  positioned={positioned}
                  canBook={canBook}
                />
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
