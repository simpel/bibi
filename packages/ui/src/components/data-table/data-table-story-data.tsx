import type { ColumnDef } from "@tanstack/react-table";
import { DropdownMenuItem } from "../dropdown-menu/dropdown-menu";
import { actionsColumn, DataTableRowActions } from "./data-table-actions";
import type { DataTableLabels, DataTableTextLabels } from "./data-table-types";

export type Room = { id: string; name: string; floor: string; status: string; seats: number };

const STATUSES = ["Available", "Booked", "Maintenance"];

export const rooms: Room[] = Array.from({ length: 120 }, (_, index) => ({
  id: `room-${index}`,
  name: `Room ${(index * 7) % 120}`,
  floor: ["Ground", "First", "Second"][index % 3] as string,
  status: STATUSES[index % 3] as string,
  seats: 10 + ((index * 13) % 90),
}));

export const paginationLabels: DataTableLabels = {
  rowsPerPage: "Rows per page",
  pageOf: (page, pageCount) => `Page ${page} of ${pageCount}`,
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
  total: (count) => `${count} rows`,
};

export const textLabels: DataTableTextLabels = {
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  clearSort: "Clear sorting",
  dragColumn: (column) => `Move column ${column}`,
  dragInstructions: "Press space to pick up the column, arrow keys to move it, space to drop.",
  columnPickedUp: (column) => `Picked up column ${column}`,
  columnMoved: (column, position, total) => `Column ${column} is at ${position} of ${total}`,
  columnDropped: (column, position, total) => `Dropped column ${column} at ${position} of ${total}`,
  selectAll: "Select all rows on the page",
  selectRow: "Select row",
  selected: (count) => `${count} selected`,
};

export const baseColumns: ColumnDef<Room>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "floor", header: "Floor" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "seats", header: "Seats" },
];

export const columnsWithActions: ColumnDef<Room>[] = [
  ...baseColumns,
  actionsColumn<Room>({
    label: "Actions",
    cell: (room) => (
      <DataTableRowActions label="Actions">
        <DropdownMenuItem>Edit {room.name}</DropdownMenuItem>
        <DropdownMenuItem destructive>Archive</DropdownMenuItem>
      </DataTableRowActions>
    ),
  }),
];
