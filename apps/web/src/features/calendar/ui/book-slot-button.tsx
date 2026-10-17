import { cn } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useAssistant } from "@/features/assistant/state/assistant-context";
import type { GridCell } from "../calendar-grid-model";
import { GRID_ITEM } from "./grid-keys";

export type BookSlotButtonProps = {
  slot: GridCell["slot"];
  row: number;
  col: number;
  first: boolean;
};

/** "Book with the assistant": a fresh conversation with the slot's prompt in the message box. */
export function BookSlotButton({ slot, row, col, first }: BookSlotButtonProps) {
  const { prefill } = useAssistant();
  return (
    <button
      type="button"
      aria-label={slot.label}
      title={slot.label}
      onClick={() => prefill({ text: slot.prompt })}
      className={cn(
        "absolute inset-0 flex items-center justify-center rounded-sm text-muted-foreground opacity-0 outline-none",
        "hover:bg-accent hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring",
      )}
      {...{ [GRID_ITEM]: "", "data-row": row, "data-col": col }}
      tabIndex={first ? 0 : -1}
    >
      <PlusIcon className="size-4" />
    </button>
  );
}
