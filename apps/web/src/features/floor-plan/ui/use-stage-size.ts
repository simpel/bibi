import { type RefObject, useEffect, useState } from "react";

export type StageSize = { width: number; height: number };

/** The drawing area's size in pixels, kept current while the window or sidebar changes. */
export function useStageSize({ ref }: { ref: RefObject<HTMLElement | null> }): StageSize {
  const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });
  // Browser API: ResizeObserver reports the stage's size so tools can be placed in pixels.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export type ToScreenInput = {
  size: StageSize;
  room: { widthCm: number; depthCm: number };
  point: { x: number; y: number };
};

/** The drawing's margin around the room, as `FloorDrawing` draws it. */
const MARGIN = 60;

/** A point in centimetres as pixels in the stage (the drawing is centred and scaled to fit). */
export function toScreen({ size, room, point }: ToScreenInput) {
  const viewWidth = room.widthCm + MARGIN * 2;
  const viewHeight = room.depthCm + MARGIN * 2;
  const scale = Math.min(size.width / viewWidth, size.height / viewHeight) || 0;
  const offsetX = (size.width - viewWidth * scale) / 2;
  const offsetY = (size.height - viewHeight * scale) / 2;
  return { x: offsetX + (point.x + MARGIN) * scale, y: offsetY + (point.y + MARGIN) * scale };
}
