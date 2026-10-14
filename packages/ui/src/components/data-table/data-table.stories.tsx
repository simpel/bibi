import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { DataTable } from "./data-table";
import type { DataTableLabels } from "./data-table-types";

type Room = { id: string; name: string; seats: number };

const rooms: Room[] = Array.from({ length: 120 }, (_, index) => ({
  id: `room-${index}`,
  name: `Rum ${index + 1}`,
  seats: 10 + index,
}));

const columns: ColumnDef<Room>[] = [
  { accessorKey: "name", header: "Namn" },
  { accessorKey: "seats", header: "Platser" },
];

const labels: DataTableLabels = {
  rowsPerPage: "Rader per sida",
  pageOf: (page, pageCount) => `Sida ${page} av ${pageCount}`,
  first: "Första sidan",
  previous: "Föregående sida",
  next: "Nästa sida",
  last: "Sista sidan",
  total: (count) => `${count} rader`,
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
      emptyText="Inga rum"
    />
  );
}

export const Default: Story = {
  args: {
    columns: [],
    data: [],
    emptyText: "Inga rum",
  },
  render: () => <Demo />,
};

export const WithoutPagination: Story = {
  args: { columns: [], data: [], emptyText: "Inga rum" },
  render: () => <DataTable columns={columns} data={rooms.slice(0, 5)} emptyText="Inga rum" />,
};
