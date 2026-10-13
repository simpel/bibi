"use client";

import { useTranslations } from "next-intl";
import type { KeyboardEvent, PointerEvent } from "react";
import { clampWidth, MAX_WIDTH, MIN_WIDTH } from "../state/panel-width";

export type ResizeHandleProps = { width: number; onResize: (input: { width: number }) => void };

const STEP = 24;
const KEY_STEPS: Record<string, number> = { ArrowLeft: STEP, ArrowRight: -STEP };

/** Drag (or arrow keys) on the panel's left edge to change its width. */
export function ResizeHandle({ width, onResize }: ResizeHandleProps) {
  const t = useTranslations("assistant");
  const onPointerMove = ({ event }: { event: PointerEvent<HTMLDivElement> }) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onResize({ width: clampWidth({ width: window.innerWidth - event.clientX }) });
  };
  const onKeyDown = ({ event }: { event: KeyboardEvent<HTMLDivElement> }) => {
    const delta = KEY_STEPS[event.key];
    if (!delta) return;
    event.preventDefault();
    onResize({ width: clampWidth({ width: width + delta }) });
  };
  return (
    // biome-ignore lint/a11y/useSemanticElements: a focusable window splitter is a separator with a value, not an <hr>
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={t("resize")}
      aria-valuenow={width}
      aria-valuemin={MIN_WIDTH}
      aria-valuemax={MAX_WIDTH}
      tabIndex={0}
      className="absolute inset-y-0 -left-1 z-10 w-2 cursor-col-resize touch-none outline-none hover:bg-primary/20 focus-visible:bg-primary/30"
      onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
      onPointerMove={(event) => onPointerMove({ event })}
      onKeyDown={(event) => onKeyDown({ event })}
    />
  );
}
