import {
  type EffectiveElement,
  effectiveElement,
  type FloorElementDto,
  type FloorElementInput,
  type FloorElementKindDto,
  type FloorPoint,
  isOpening,
  type PlacedElement,
  snapToWall,
} from "@bibi/core/schemas";

/** A piece while it is edited: the save input plus a key that is stable within the editor. */
export type DraftElement = Required<Omit<FloorElementInput, "label" | "emergencyExit">> & {
  key: string;
  label: string | null;
  /** A door or window marked as an emergency exit (floor plan only). */
  emergencyExit?: boolean;
};

export type KindMap = ReadonlyMap<string, FloorElementKindDto>;

let counter = 0;

/** A key for a piece created in the editor (never sent to the server). */
export const newKey = () => {
  counter += 1;
  return `draft-${counter}`;
};

export const NO_OVERRIDES = {
  widthCm: null,
  depthCm: null,
  seats: null,
  seatsTop: null,
  seatsRight: null,
  seatsBottom: null,
  seatsLeft: null,
  swingDeg: null,
} as const;

/** A stored piece as a draft. */
export function toDraft({ element }: { element: FloorElementDto }): DraftElement {
  const { id, kindId, xCm, yCm, rotationDeg, label, widthCm, depthCm } = element;
  const { seats, seatsTop, seatsRight, seatsBottom, seatsLeft, swingDeg } = element;
  return {
    ...{ key: id, kindId, xCm, yCm, rotationDeg, label, widthCm, depthCm },
    ...{ seats, seatsTop, seatsRight, seatsBottom, seatsLeft, swingDeg },
    emergencyExit: element.emergencyExit,
  };
}

/** A draft as the save input. */
export function toInput({ element }: { element: DraftElement }): FloorElementInput {
  const { key: _key, ...input } = element;
  return input;
}

export type EffectiveInput = { element: DraftElement; kinds: KindMap };

/** Size and seats after inheritance; null when the kind is gone. */
export function effectiveOf({ element, kinds }: EffectiveInput): EffectiveElement | null {
  const kind = kinds.get(element.kindId);
  return kind ? effectiveElement({ element, kind }) : null;
}

/** A draft placed for the geometry functions. */
export function placedOf({ element, kinds }: EffectiveInput): PlacedElement | null {
  const effective = effectiveOf({ element, kinds });
  if (!effective) return null;
  const { key: id, xCm, yCm, rotationDeg } = element;
  return { ...effective, id, xCm, yCm, rotationDeg, emergencyExit: element.emergencyExit === true };
}

export type SeatTotalInput = { elements: readonly DraftElement[]; kinds: KindMap };

export const seatTotal = ({ elements, kinds }: SeatTotalInput) =>
  elements.reduce((sum, element) => sum + (effectiveOf({ element, kinds })?.seatCount ?? 0), 0);

export type SnapOpeningsInput = {
  elements: readonly DraftElement[];
  outline: readonly FloorPoint[];
  kinds: KindMap;
};

/** Doors and windows kept on the nearest wall, turned along it (ADR 0102). */
export function snapOpenings({ elements, outline, kinds }: SnapOpeningsInput): DraftElement[] {
  return elements.map((element) => {
    const kind = kinds.get(element.kindId);
    if (!kind || !isOpening(kind)) return element;
    const widthCm = element.widthCm ?? kind.widthCm;
    const placed = snapToWall({ outline, xCm: element.xCm, yCm: element.yCm, widthCm });
    const same =
      placed.xCm === element.xCm &&
      placed.yCm === element.yCm &&
      placed.rotationDeg === element.rotationDeg;
    return same ? element : { ...element, ...placed };
  });
}
