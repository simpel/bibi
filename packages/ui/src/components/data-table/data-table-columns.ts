import type { ColumnDef } from "@tanstack/react-table";

/** The id TanStack derives for a column definition. */
export function columnIdOf<TData, TValue>({
  column,
}: {
  column: ColumnDef<TData, TValue>;
}): string {
  if (column.id) return column.id;
  if ("accessorKey" in column && typeof column.accessorKey === "string") {
    return column.accessorKey.replaceAll(".", "_");
  }
  if (typeof column.header === "string") return column.header;
  return "";
}

/** Plain-text column titles by id, used in drag handle labels and announcements. */
export function columnTitles<TData, TValue>({
  columns,
}: {
  columns: ColumnDef<TData, TValue>[];
}): Record<string, string> {
  const titles: Record<string, string> = {};
  for (const column of columns) {
    const id = columnIdOf({ column });
    titles[id] = typeof column.header === "string" ? column.header : id;
  }
  return titles;
}
