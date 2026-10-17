import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/button";
import { DataTable } from "./data-table";
import {
  baseColumns,
  columnsWithActions,
  paginationLabels,
  type Room,
  rooms,
  textLabels,
} from "./data-table-story-data";

const meta = { title: "Components/DataTable", component: DataTable } satisfies Meta<
  typeof DataTable
>;

export default meta;
type Story = StoryObj<typeof meta>;

const args = { columns: [], data: [], emptyText: "No rooms", textLabels };

function PaginatedDemo() {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 });
  const [selected, setSelected] = useState<string>();
  const start = pagination.pageIndex * pagination.pageSize;
  return (
    <DataTable
      columns={columnsWithActions}
      data={rooms.slice(start, start + pagination.pageSize)}
      pagination={{
        ...pagination,
        pageCount: Math.ceil(rooms.length / pagination.pageSize),
        totalCount: rooms.length,
        onPaginationChange: setPagination,
        labels: paginationLabels,
      }}
      getRowId={(row) => row.id}
      selectedRowId={selected}
      onRowClick={(row) => setSelected(row.id)}
      emptyText="No rooms"
      textLabels={textLabels}
    />
  );
}

/** Server pagination, sortable and draggable columns, row actions and row click. */
export const Default: Story = { args, render: () => <PaginatedDemo /> };

/** Click a header to cycle ascending, descending, none. Names sort locale and number aware. */
export const Sorting: Story = {
  args,
  render: () => (
    <DataTable
      columns={baseColumns}
      data={rooms.slice(0, 12)}
      emptyText="No rooms"
      textLabels={textLabels}
    />
  ),
};

function ReorderDemo() {
  const [order, setOrder] = useState<string[]>();
  return (
    <div className="flex flex-col gap-2">
      <DataTable
        columns={columnsWithActions}
        data={rooms.slice(0, 6)}
        columnOrder={order}
        onColumnOrderChange={setOrder}
        emptyText="No rooms"
        textLabels={textLabels}
      />
      <p className="text-sm text-muted-foreground">Saved order: {order?.join(", ") ?? "default"}</p>
    </div>
  );
}

/** Drag the grip or use the keyboard (focus the grip, space, arrows). Actions stay far right. */
export const DragReorder: Story = { args, render: () => <ReorderDemo /> };

function SelectionDemo() {
  const [message, setMessage] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <DataTable
        columns={columnsWithActions}
        data={rooms.slice(0, 10)}
        getRowId={(row: Room) => row.id}
        selectable
        bulkActions={(rows) => (
          <Button size="sm" onClick={() => setMessage(`Archived ${rows.length} rooms`)}>
            Archive selected
          </Button>
        )}
        emptyText="No rooms"
        textLabels={textLabels}
      />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/** Pinned checkbox column and a bulk action toolbar. */
export const SelectionWithBulkActions: Story = { args, render: () => <SelectionDemo /> };

export const Empty: Story = {
  args,
  render: () => (
    <DataTable columns={baseColumns} data={[]} emptyText="No rooms" textLabels={textLabels} />
  ),
};
