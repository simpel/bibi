import { useDraggable } from "@dnd-kit/core";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { type CardSurface, cardSurfaceProps } from "../booking-tone/booking-tone";

export type KanbanCardProps = {
  id: string;
  children: ReactNode;
  /** A click anywhere on the card, or Enter on it, opens it; a drag (5 px) does not. */
  onOpen?: (() => void) | undefined;
  /** Soft, following and done, the same cues as the timeline cards and its attention bar (`cardSurfaceProps`). */
  surface?: CardSurface | undefined;
};

/**
 * A draggable card. The whole card is the handle: focus it and press space to lift it. With
 * `onOpen`, a click or Enter opens it.
 */
export function KanbanCard({ id, children, onOpen, surface }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  const keyDown = ({ event }: { event: KeyboardEvent<HTMLDivElement> }) => {
    // A key on a button inside the card (e.g. pin) is the button's, not the card's.
    if (event.target !== event.currentTarget) return;
    if (onOpen && event.key === "Enter") {
      event.preventDefault();
      onOpen();
      return;
    }
    listeners?.onKeyDown?.(event);
  };
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: dnd-kit's attributes give it role="button" and a tab stop; a <button> could not hold the card's links.
    <div
      ref={setNodeRef}
      data-slot="kanban-card"
      data-dragging={isDragging || undefined}
      className={cn(
        onOpen ? "cursor-pointer" : "cursor-grab",
        "min-w-0 rounded-xl border bg-card p-3 text-card-foreground shadow-sm outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring",
        surface && cardSurfaceProps({ surface }).className,
        isDragging && "opacity-40",
      )}
      {...attributes}
      {...listeners}
      onKeyDown={(event) => keyDown({ event })}
      onClick={onOpen}
    >
      {children}
    </div>
  );
}
