import { SEAT_PITCH_CM, type SeatSides } from "@bibi/core/schemas";
import { type DraftElement, type KindMap, NO_OVERRIDES, newKey } from "./draft";

type Keys = ReadonlySet<string>;
type Pieces = readonly DraftElement[];

const each = ({
  elements,
  keys,
  change,
}: {
  elements: Pieces;
  keys: Keys;
  change: (e: DraftElement) => DraftElement;
}) => elements.map((element) => (keys.has(element.key) ? change(element) : element));

export const rotatePieces = ({
  elements,
  keys,
  step,
}: {
  elements: Pieces;
  keys: Keys;
  step: number;
}) =>
  each({
    elements,
    keys,
    change: (e) => ({ ...e, rotationDeg: (((e.rotationDeg + step) % 360) + 360) % 360 }),
  });

export const movePieces = ({
  elements,
  keys,
  dx,
  dy,
}: {
  elements: Pieces;
  keys: Keys;
  dx: number;
  dy: number;
}) => each({ elements, keys, change: (e) => ({ ...e, xCm: e.xCm + dx, yCm: e.yCm + dy }) });

export const removePieces = ({ elements, keys }: { elements: Pieces; keys: Keys }) =>
  elements.filter((element) => !keys.has(element.key));

/** Copies of the pieces, 40 cm down and right; returns the new list and the copies' keys. */
export function duplicatePieces({ elements, keys }: { elements: Pieces; keys: Keys }) {
  const copies = elements
    .filter((element) => keys.has(element.key))
    .map((element) => ({
      ...element,
      key: newKey(),
      xCm: element.xCm + 40,
      yCm: element.yCm + 40,
    }));
  return { elements: [...elements, ...copies], keys: copies.map((copy) => copy.key) };
}

/** An own value, or null when it equals the kind's (so the piece keeps inheriting). */
const own = ({ value, kindValue }: { value: number; kindValue: number }) =>
  value === kindValue ? null : value;

export type ResizeInput = {
  element: DraftElement;
  kinds: KindMap;
  widthCm?: number;
  depthCm?: number;
};

export function resizePiece({ element, kinds, widthCm, depthCm }: ResizeInput): DraftElement {
  const kind = kinds.get(element.kindId);
  if (!kind) return element;
  return {
    ...element,
    ...(widthCm === undefined ? {} : { widthCm: own({ value: widthCm, kindValue: kind.widthCm }) }),
    ...(depthCm === undefined ? {} : { depthCm: own({ value: depthCm, kindValue: kind.depthCm }) }),
  };
}

export type SetSidesInput = { element: DraftElement; kinds: KindMap; sides: Partial<SeatSides> };

/** Chairs per side of a rectangular piece. */
export function setSides({ element, kinds, sides }: SetSidesInput): DraftElement {
  const kind = kinds.get(element.kindId);
  if (!kind) return element;
  const pick = ({
    side,
    kindValue,
    current,
  }: {
    side: keyof SeatSides;
    kindValue: number;
    current: number | null;
  }) => (sides[side] === undefined ? current : own({ value: sides[side] ?? 0, kindValue }));
  return {
    ...element,
    seatsTop: pick({ side: "top", kindValue: kind.seatsTop, current: element.seatsTop }),
    seatsRight: pick({ side: "right", kindValue: kind.seatsRight, current: element.seatsRight }),
    seatsBottom: pick({
      side: "bottom",
      kindValue: kind.seatsBottom,
      current: element.seatsBottom,
    }),
    seatsLeft: pick({ side: "left", kindValue: kind.seatsLeft, current: element.seatsLeft }),
  };
}

export type SetAroundInput = { element: DraftElement; kinds: KindMap; seats: number };

/**
 * Chairs around a round piece, or in a row of chairs. A row grows and shrinks from its left end so
 * the chairs keep their spacing.
 */
export function setAround({ element, kinds, seats }: SetAroundInput): DraftElement {
  const kind = kinds.get(element.kindId);
  if (!kind) return element;
  if (kind.shape !== "SEAT_ROW")
    return { ...element, seats: own({ value: seats, kindValue: kind.seats }) };
  const before = element.widthCm ?? kind.widthCm;
  const width = Math.max(SEAT_PITCH_CM, seats * SEAT_PITCH_CM);
  const shift = (width - before) / 2;
  const radians = (element.rotationDeg * Math.PI) / 180;
  return {
    ...element,
    seats: own({ value: seats, kindValue: kind.seats }),
    widthCm: own({ value: width, kindValue: kind.widthCm }),
    xCm: Math.round(element.xCm + shift * Math.cos(radians)),
    yCm: Math.round(element.yCm + shift * Math.sin(radians)),
  };
}

/** Back to the library's size and chairs. */
export const resetPiece = ({ element }: { element: DraftElement }): DraftElement => ({
  ...element,
  ...NO_OVERRIDES,
});

export const isOverridden = ({ element }: { element: DraftElement }) =>
  Object.keys(NO_OVERRIDES).some((key) => element[key as keyof typeof NO_OVERRIDES] !== null);
