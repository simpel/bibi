import {
  type EffectiveElement,
  effectiveElement,
  type FloorElementDto,
  type FloorElementInput,
  type FloorElementKindDto,
  type PlacedElement,
} from "@bibi/core/schemas";

/** A piece while it is edited: the save input plus a key that is stable within the editor. */
export type DraftElement = Required<Omit<FloorElementInput, "label">> & {
  key: string;
  label: string | null;
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
} as const;

/** A stored piece as a draft. */
export function toDraft({ element }: { element: FloorElementDto }): DraftElement {
  const { id, kindId, xCm, yCm, rotationDeg, label, widthCm, depthCm } = element;
  const { seats, seatsTop, seatsRight, seatsBottom, seatsLeft } = element;
  return {
    ...{ key: id, kindId, xCm, yCm, rotationDeg, label, widthCm, depthCm },
    ...{ seats, seatsTop, seatsRight, seatsBottom, seatsLeft },
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
  return { ...effective, id, xCm, yCm, rotationDeg };
}

export type SeatTotalInput = { elements: readonly DraftElement[]; kinds: KindMap };

export const seatTotal = ({ elements, kinds }: SeatTotalInput) =>
  elements.reduce((sum, element) => sum + (effectiveOf({ element, kinds })?.seatCount ?? 0), 0);
