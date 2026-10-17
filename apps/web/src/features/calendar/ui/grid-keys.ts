import type { KeyboardEvent } from "react";

/** Marks a focusable element of the grid; `data-row` and `data-col` give its cell. */
export const GRID_ITEM = "data-grid-item";

type Item = HTMLElement & { dataset: { row?: string; col?: string } };

const position = ({ item }: { item: Item }) => ({
  row: Number(item.dataset.row),
  col: Number(item.dataset.col),
});

const itemsOf = ({ grid }: { grid: HTMLElement }): Item[] =>
  Array.from(grid.querySelectorAll<Item>(`[${GRID_ITEM}]`));

/** The item in `row` whose column is closest to `col`. */
function closestInRow({ items, row, col }: { items: Item[]; row: number; col: number }) {
  const inRow = items.filter((item) => position({ item }).row === row);
  const distance = ({ item }: { item: Item }) => Math.abs(position({ item }).col - col);
  return inRow.reduce<Item | undefined>(
    (best, item) => (!best || distance({ item }) < distance({ item: best }) ? item : best),
    undefined,
  );
}

type TargetInput = { items: Item[]; current: Item; key: string };

function target({ items, current, key }: TargetInput): Item | undefined {
  const { row, col } = position({ item: current });
  const inRow = items.filter((item) => position({ item }).row === row);
  const index = inRow.indexOf(current);
  if (key === "ArrowRight") return inRow[index + 1];
  if (key === "ArrowLeft") return inRow[index - 1];
  if (key === "Home") return inRow[0];
  if (key === "End") return inRow[inRow.length - 1];
  if (key !== "ArrowUp" && key !== "ArrowDown") return undefined;
  const rows = [...new Set(items.map((item) => position({ item }).row))].sort((a, b) => a - b);
  const next = rows[rows.indexOf(row) + (key === "ArrowDown" ? 1 : -1)];
  return next === undefined ? undefined : closestInRow({ items, row: next, col });
}

/**
 * Arrow keys move between blocks and empty slots (left/right within a space, up/down between
 * spaces), Home/End jump to the row's ends. A roving tab index keeps one tab stop in the grid.
 */
export function onGridKeyDown({ event }: { event: KeyboardEvent<HTMLElement> }) {
  const current = (event.target as HTMLElement).closest<Item>(`[${GRID_ITEM}]`);
  if (!current) return;
  const items = itemsOf({ grid: event.currentTarget });
  const next = target({ items, current, key: event.key });
  if (!next) return;
  event.preventDefault();
  for (const item of items) item.tabIndex = item === next ? 0 : -1;
  next.focus();
}
