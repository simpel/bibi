import type { KanbanColumnData } from "./kanban-types";

export type KanbanColumnHeaderProps = { column: KanbanColumnData; count: number };

export function KanbanColumnHeader({ column, count }: KanbanColumnHeaderProps) {
  return (
    <header className="flex items-center gap-2 px-1 text-sm font-medium">
      {column.color ? (
        <span
          aria-hidden
          className="size-2 rounded-full"
          style={{ backgroundColor: column.color }}
        />
      ) : null}
      <span className="truncate">{column.title}</span>
      <span className="ml-auto text-xs text-muted-foreground">{count}</span>
    </header>
  );
}
