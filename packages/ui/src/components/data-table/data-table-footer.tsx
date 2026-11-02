import { flexRender, type HeaderGroup } from "@tanstack/react-table";
import { TableCell, TableFooter, TableRow } from "../table/table";

export type DataTableFooterProps<TData> = { groups: HeaderGroup<TData>[] };

/**
 * A totals row under the body, in the columns' current order: shown only when some column
 * defines a `footer` (e.g. the sum of an amount column).
 */
export function DataTableFooter<TData>({ groups }: DataTableFooterProps<TData>) {
  const row = groups[0];
  if (!row?.headers.some((header) => header.column.columnDef.footer !== undefined)) return null;
  return (
    <TableFooter>
      <TableRow>
        {row.headers.map((header) => (
          <TableCell key={header.id}>
            {header.isPlaceholder || header.column.columnDef.footer === undefined
              ? null
              : flexRender(header.column.columnDef.footer, header.getContext())}
          </TableCell>
        ))}
      </TableRow>
    </TableFooter>
  );
}
