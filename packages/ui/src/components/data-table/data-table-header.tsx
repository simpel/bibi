import type { HeaderGroup } from "@tanstack/react-table";
import { TableHeader, TableRow } from "../table/table";
import { DataTableHeadCell } from "./data-table-head-cell";
import type { DataTableTextLabels } from "./data-table-types";

export type DataTableHeaderProps<TData> = {
  groups: HeaderGroup<TData>[];
  titles: Readonly<Record<string, string>>;
  labels: DataTableTextLabels;
};

export function DataTableHeader<TData>({ groups, titles, labels }: DataTableHeaderProps<TData>) {
  return (
    <TableHeader>
      {groups.map((group) => (
        <TableRow key={group.id}>
          {group.headers.map((header) => (
            <DataTableHeadCell
              key={header.id}
              header={header}
              title={titles[header.column.id] ?? header.column.id}
              labels={labels}
            />
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
