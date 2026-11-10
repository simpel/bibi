import { type FloorElementDto, seatPositions } from "@bibi/core/schemas";
import type { FloorDrawingElement, FloorDrawingTone } from "@bibi/ui";
import { type DraftElement, effectiveOf, type KindMap } from "./draft";

export type NameOf = (input: { kindName: string; label: string | null; seats: number }) => string;

export type DraftToDrawingInput = {
  element: DraftElement;
  kinds: KindMap;
  tone: FloorDrawingTone;
  nameOf: NameOf;
};

/** A draft piece as the drawing takes it, with its chairs placed. */
export function draftToDrawing({ element, kinds, tone, nameOf }: DraftToDrawingInput) {
  const effective = effectiveOf({ element, kinds });
  const kind = kinds.get(element.kindId);
  if (!effective || !kind) return null;
  const drawn: FloorDrawingElement = {
    id: element.key,
    shape: effective.shape,
    xCm: element.xCm,
    yCm: element.yCm,
    rotationDeg: element.rotationDeg,
    widthCm: effective.widthCm,
    depthCm: effective.depthCm,
    seats: seatPositions({ element: effective }),
    label: element.label,
    fixed: effective.fixed,
    keepClearCm: effective.keepClearCm,
    swingDeg: effective.swingDeg,
    name: nameOf({ kindName: kind.name, label: element.label, seats: effective.seatCount }),
    tone,
  };
  return drawn;
}

/** A stored piece (read-only views: the floor plan's fixed parts, thumbnails). */
export function storedToDrawing({ element }: { element: FloorElementDto }): FloorDrawingElement {
  const effective = {
    shape: element.shape,
    widthCm: element.effectiveWidthCm,
    depthCm: element.effectiveDepthCm,
    around: element.effectiveAround,
    sides: element.effectiveSides,
    seatCount: element.seatCount,
    fixed: element.fixed,
    keepClearCm: element.keepClearCm,
    swingDeg: element.effectiveSwingDeg,
  };
  return {
    id: element.id,
    shape: element.shape,
    xCm: element.xCm,
    yCm: element.yCm,
    rotationDeg: element.rotationDeg,
    widthCm: effective.widthCm,
    depthCm: effective.depthCm,
    seats: seatPositions({ element: effective }),
    label: element.label,
    fixed: element.fixed,
    keepClearCm: element.keepClearCm,
    swingDeg: element.effectiveSwingDeg,
    name: element.label ?? "",
  };
}
