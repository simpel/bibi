"use client";

import { cn } from "@bibi/ui";
import { GripHorizontalIcon } from "lucide-react";
import { type PointerEvent, type ReactNode, useRef, useState } from "react";

type Offset = { x: number; y: number };

/**
 * A card floating over its positioned parent that is moved by its grip: when it hides part of
 * the floor, drag it aside. It stays inside the parent.
 */
export type DraggableCardProps = {
  children: ReactNode;
  className?: string;
  /** Where it starts, relative to its corner: cards opened together are staggered. */
  initial?: Offset;
  /** In front of the other cards. */
  raised?: boolean;
  /** Pressed: the owner puts this card in front. */
  onRaise?: () => void;
};

export function DraggableCard({
  children,
  className,
  initial = { x: 0, y: 0 },
  raised = false,
  onRaise,
}: DraggableCardProps) {
  const card = useRef<HTMLDivElement>(null);
  const drag = useRef<{ from: Offset; start: Offset } | null>(null);
  const [offset, setOffset] = useState<Offset>(initial);
  const down = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { from: { x: event.clientX, y: event.clientY }, start: offset };
  };
  const move = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    const current = drag.current;
    const box = card.current?.getBoundingClientRect();
    const bounds = card.current?.offsetParent?.getBoundingClientRect();
    if (!current || !box || !bounds) return;
    // The card's place without the offset, so the offset can be limited to the parent.
    const baseLeft = box.left - offset.x;
    const baseTop = box.top - offset.y;
    const wanted = {
      x: current.start.x + event.clientX - current.from.x,
      y: current.start.y + event.clientY - current.from.y,
    };
    setOffset({
      x: Math.min(bounds.right - baseLeft - box.width, Math.max(bounds.left - baseLeft, wanted.x)),
      y: Math.min(bounds.bottom - baseTop - box.height, Math.max(bounds.top - baseTop, wanted.y)),
    });
  };
  return (
    <div
      ref={card}
      className={cn(
        "absolute flex flex-col rounded-xl border bg-card shadow-lg",
        raised ? "z-20" : "z-10",
        className,
      )}
      onPointerDownCapture={onRaise}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: a touch and mouse grip; the card has no keyboard move */}
      <div
        className="flex h-8 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
        onPointerDown={(event) => down({ event })}
        onPointerMove={(event) => move({ event })}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <GripHorizontalIcon className="size-5" aria-hidden />
      </div>
      <div className="min-h-0 overflow-y-auto px-4 pb-4">{children}</div>
    </div>
  );
}
