import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "./data-table";
import type { DataTableLabels } from "./data-table-types";

type Room = { id: string; name: string; seats: number };

const rooms: Room[] = Array.from({ length: 120 }, (_, index) => ({
  id: `room-${index}`,
  name: `Room ${index + 1}`,
  seats: 10 + index,
}));

const columns: ColumnDef<Room>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "seats", header: "Seats" },
];

const labels: DataTableLabels = {
  rowsPerPage: "Rows per page",
  pageOf: (page, pageCount) => `Page ${page} of ${pageCount}`,
  first: "First page",
  previous: "Previous page",
  next: "Next page",
  last: "Last page",
  total: (count) => `${count} rows`,
};

const meta = { title: "Components/DataTable", component: DataTable } satisfies Meta<
  typeof DataTable
>;

export default meta;
type Story = StoryObj<typeof meta>;

function Demo() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selected, setSelected] = useState<string>();
  const start = pagination.pageIndex * pagination.pageSize;
  return (
    <DataTable
      columns={columns}
      data={rooms.slice(start, start + pagination.pageSize)}
      pagination={{
        ...pagination,
        pageCount: Math.ceil(rooms.length / pagination.pageSize),
        totalCount: rooms.length,
        onPaginationChange: setPagination,
        labels,
      }}
      getRowId={(row) => row.id}
      selectedRowId={selected}
      onRowClick={(row) => setSelected(row.id)}
      emptyText="No rooms"
    />
  );
}

export const Default: Story = {
  args: {
    columns: [],
    data: [],
    emptyText: "No rooms",
  },
  render: () => <Demo />,
};

export const WithoutPagination: Story = {
  args: { columns: [], data: [], emptyText: "No rooms" },
  render: () => <DataTable columns={columns} data={rooms.slice(0, 5)} emptyText="No rooms" />,
};
