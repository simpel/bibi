import { flexRender, type HeaderGroup } from "@tanstack/react-table";
import { TableHead, TableHeader, TableRow } from "../table/table";

export type DataTableHeaderProps<TData> = { groups: HeaderGroup<TData>[] };

export function DataTableHeader<TData>({ groups }: DataTableHeaderProps<TData>) {
  return (
    <TableHeader>
      {groups.map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => (
            <TableHead key={header.id}>
              {header.isPlaceholder
                ? null
                : flexRender(header.column.columnDef.header, header.getContext())}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
