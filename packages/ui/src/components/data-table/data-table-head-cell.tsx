import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { flexRender, type Header } from "@tanstack/react-table";
import { GripVerticalIcon } from "lucide-react";
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
  const content = flexRender(column.columnDef.header, header.getContext());
  return (
    <TableHead
      ref={sortable.setNodeRef}
      aria-sort={column.getCanSort() ? ariaSort({ sorted: column.getIsSorted() }) : undefined}
      style={{
        transform: CSS.Translate.toString(sortable.transform),
        transition: sortable.transition,
      }}
      className={cn(sortable.isDragging && "relative z-10 bg-muted shadow-sm")}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          ref={sortable.setActivatorNodeRef}
          aria-label={labels.dragColumn(title)}
          className="-ml-1 cursor-grab touch-none rounded-sm p-0.5 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          <GripVerticalIcon className="size-3.5" aria-hidden />
        </button>
        {column.getCanSort() ? (
          <DataTableSortButton column={column} title={title} labels={labels}>
            {content}
          </DataTableSortButton>
        ) : (
          content
        )}
      </div>
    </TableHead>
  );
}

/** A header cell: pinned columns are plain, all others are draggable and (if sortable) sortable. */
export function DataTableHeadCell<TData>(props: DataTableHeadCellProps<TData>) {
  const { header } = props;
  if (header.isPlaceholder) return <TableHead />;
  if (isPinnedColumn({ id: header.column.id })) {
    return (
      <TableHead className="w-10">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </TableHead>
    );
  }
  return <MovableHead {...props} />;
}
