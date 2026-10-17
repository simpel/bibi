import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender, type Header } from "@tanstack/react-table";
import { cn } from "../../lib/cn";
import { TableHead } from "../table/table";
import { isPinnedColumn } from "./data-table-order";
import { DataTableSortButton } from "./data-table-sort-button";
import type { DataTableTextLabels } from "./data-table-types";

export type DataTableHeadCellProps<TData> = {
  header: Header<TData, unknown>;
  title: string;
  labels: DataTableTextLabels;
};

function ariaSort({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return "ascending";
  if (sorted === "desc") return "descending";
  return "none";
}

function MovableHead<TData>({ header, title, labels }: DataTableHeadCellProps<TData>) {
  const { column } = header;
  const sortable = useSortable({ id: column.id });
  const { setNodeRef, setActivatorNodeRef } = sortable;
  // `aria-pressed` is for buttons; the cell stays a column header that can also be picked up.
  const { "aria-pressed": _pressed, ...attributes } = sortable.attributes;
  const content = flexRender(column.columnDef.header, header.getContext());
  return (
    <TableHead
      ref={(node) => {
        setNodeRef(node);
        setActivatorNodeRef(node);
      }}
      {...attributes}
      {...sortable.listeners}
      role="columnheader"
      aria-description={labels.dragColumn(title)}
      aria-sort={column.getCanSort() ? ariaSort({ sorted: column.getIsSorted() }) : undefined}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(
        "cursor-grab touch-pan-y outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing",
        sortable.isDragging && "relative z-10 bg-muted shadow-sm",
      )}
    >
      {column.getCanSort() ? (
        <DataTableSortButton column={column} title={title} labels={labels}>
          {content}
        </DataTableSortButton>
      ) : (
        content
      )}
    </TableHead>
  );
}

/** A header cell: pinned columns are plain, all others are draggable and (if sortable) sortable. */
export function DataTableHeadCell<TData>(props: DataTableHeadCellProps<TData>) {
  const { header } = props;
  if (header.isPlaceholder) return <TableHead />;
  if (isPinnedColumn({ id: header.column.id })) {
    return (
      <TableHead data-column-pinned={header.column.id} className="w-10">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </TableHead>
    );
  }
  return <MovableHead {...props} />;
}
