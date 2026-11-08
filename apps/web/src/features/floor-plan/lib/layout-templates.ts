import {
  type FloorElementKindDto,
  type FloorPoint,
  footprint,
  insideOutline,
  keepClearZone,
  type PlacedElement,
  polygonsOverlap,
} from "@bibi/core/schemas";
import { type DraftElement, type KindMap, NO_OVERRIDES, newKey, placedOf } from "./draft";

export const TEMPLATES = ["rows", "uShape", "banquet"] as const;
export type TemplateKey = (typeof TEMPLATES)[number];

export type Room = { widthCm: number; depthCm: number; outline: readonly FloorPoint[] };

type KindPick = (kind: FloorElementKindDto) => boolean;

const PICKS: Record<TemplateKey, KindPick> = {
  rows: (kind) => kind.shape === "SEAT_ROW",
  uShape: (kind) => kind.shape === "RECT" && kind.seatsTop + kind.seatsBottom > 0,
  banquet: (kind) => kind.shape === "ROUND" && kind.seats >= 6,
};

/** The library kind a template builds with, if the organization has one. */
export function templateKind({ template, kinds }: { template: TemplateKey; kinds: KindMap }) {
  return [...kinds.values()].find((kind) => !kind.fixed && PICKS[template](kind)) ?? null;
}

const piece = ({
  kind,
  xCm,
  yCm,
  rotationDeg = 0,
}: {
  kind: FloorElementKindDto;
  xCm: number;
  yCm: number;
  rotationDeg?: number;
}): DraftElement => ({
  ...NO_OVERRIDES,
  key: newKey(),
  kindId: kind.id,
  xCm: Math.round(xCm),
  yCm: Math.round(yCm),
  rotationDeg,
  label: null,
});

type BuildInput = { kind: FloorElementKindDto; people: number; room: Room };

/** Rows of chairs facing the top wall, split by a middle aisle. */
function rows({ kind, people, room }: BuildInput): DraftElement[] {
  const pitch = 50;
  const perRow = Math.max(4, Math.min(16, Math.floor((room.widthCm - 220) / pitch / 2) * 2));
  const out: DraftElement[] = [];
  for (let row = 0, left = people; left > 0 && row < 40; row += 1) {
    const inRow = Math.min(perRow, left);
    left -= inRow;
    const halves = [Math.ceil(inRow / 2), Math.floor(inRow / 2)];
    halves.forEach((seats, side) => {
      if (seats === 0) return;
      const width = seats * pitch;
      const xCm = room.widthCm / 2 + (side === 0 ? -1 : 1) * (60 + width / 2);
      out.push({ ...piece({ kind, xCm, yCm: 180 + row * 95 }), seats, widthCm: width });
    });
  }
  return out;
}

/** Tables in a U open towards the top wall, chairs on the outside. */
function uShape({ kind, people, room }: BuildInput): DraftElement[] {
  const perTable = Math.max(kind.seatsTop, kind.seatsBottom, 1);
  const tables = Math.max(3, Math.ceil(people / perTable));
  const legs = Math.floor((tables - Math.round(tables / 3)) / 2);
  const base = tables - legs * 2;
  const w = kind.widthCm;
  const d = kind.depthCm;
  const cx = room.widthCm / 2;
  const span = base * w;
  const one = { seatsTop: 0, seatsBottom: perTable };
  const out: DraftElement[] = [];
  for (let i = 0; i < legs; i += 1) {
    const yCm = 200 + w / 2 + i * w;
    out.push({ ...piece({ kind, xCm: cx - span / 2 - d / 2, yCm, rotationDeg: 90 }), ...one });
    out.push({ ...piece({ kind, xCm: cx + span / 2 + d / 2, yCm, rotationDeg: 270 }), ...one });
  }
  for (let j = 0; j < base; j += 1) {
    const xCm = cx - span / 2 + w / 2 + j * w;
    out.push({ ...piece({ kind, xCm, yCm: 200 + legs * w + d / 2 }), ...one });
  }
  return out;
}

/** Round tables in staggered rows, kept clear of the fixed parts and each other. */
function banquet({
  kind,
  people,
  room,
  blocked,
  kinds,
}: BuildInput & { blocked: readonly FloorPoint[][]; kinds: KindMap }) {
  const tables = Math.ceil(people / Math.max(kind.seats, 1));
  const pitch = kind.widthCm + 150;
  const out: DraftElement[] = [];
  for (let row = 0; out.length < tables && row < 30; row += 1) {
    for (let col = 0; out.length < tables && col < 30; col += 1) {
      const offset = row % 2 ? pitch / 2 : 0;
      const candidate = piece({
        kind,
        xCm: pitch / 2 + 20 + col * pitch + offset,
        yCm: pitch / 2 + 20 + row * (pitch - 40),
      });
      const placed = placedOf({ element: candidate, kinds });
      if (!placed) return out;
      const foot = footprint({ element: placed });
      const fits = foot.every((point) => insideOutline({ point, outline: room.outline }));
      const free = !blocked.some((b) => polygonsOverlap({ a: b, b: foot }));
      const apart = out.every((other) => {
        const otherPlaced = placedOf({ element: other, kinds });
        return (
          !otherPlaced || !polygonsOverlap({ a: footprint({ element: otherPlaced }), b: foot })
        );
      });
      if (fits && free && apart) out.push({ ...candidate, label: String(out.length + 1) });
    }
  }
  return out;
}

export type BuildTemplateInput = {
  template: TemplateKey;
  people: number;
  room: Room;
  kinds: KindMap;
  fixed: readonly PlacedElement[];
};

/** The pieces of a template for that many people, or none when the library lacks the kind. */
export function buildTemplate({ template, people, room, kinds, fixed }: BuildTemplateInput) {
  const kind = templateKind({ template, kinds });
  if (!kind) return [];
  if (template === "rows") return rows({ kind, people, room });
  if (template === "uShape") return uShape({ kind, people, room });
  const blocked = fixed.flatMap((element) =>
    [footprint({ element }), keepClearZone({ element })].filter(
      (zone): zone is FloorPoint[] => zone !== null,
    ),
  );
  return banquet({ kind, people, room, blocked, kinds });
}
