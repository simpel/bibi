import { reedSolomonRemainder } from "./reed-solomon";

/** The QR symbol's parts for byte mode, level M, versions 1 to 10 (ISO/IEC 18004). */

const ECC_PER_BLOCK = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26];
const BLOCKS = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5];
const TOTAL_CODEWORDS = [26, 44, 70, 100, 134, 172, 196, 242, 292, 346];
const ALIGNMENT = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];
/** Level M in the format bits. */
const ECC_BITS = 0;

/** The modules (`[y][x]`, true = dark) and which of them are function patterns. */
export type Grid = { size: number; modules: boolean[][]; reserved: boolean[][] };
type Version = { version: number };

export const VERSIONS = TOTAL_CODEWORDS.length;

/** How many data codewords a version holds at level M. */
export const dataCapacity = ({ version }: Version) =>
  (TOTAL_CODEWORDS[version - 1] ?? 0) -
  (ECC_PER_BLOCK[version - 1] ?? 0) * (BLOCKS[version - 1] ?? 0);

type BitsInput = { bits: number[]; value: number; length: number };

const pushBits = ({ bits, value, length }: BitsInput) => {
  for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
};

/** The data codewords: mode, count, bytes, terminator and the 0xEC/0x11 padding. */
export function dataCodewords({ bytes, version }: Version & { bytes: Uint8Array }): number[] {
  const capacity = dataCapacity({ version });
  const bits: number[] = [];
  pushBits({ bits, value: 0b0100, length: 4 });
  pushBits({ bits, value: bytes.length, length: version < 10 ? 8 : 16 });
  for (const byte of bytes) pushBits({ bits, value: byte, length: 8 });
  pushBits({ bits, value: 0, length: Math.min(4, capacity * 8 - bits.length) });
  pushBits({ bits, value: 0, length: (8 - (bits.length % 8)) % 8 });
  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    words.push(bits.slice(i, i + 8).reduce((word, bit) => (word << 1) | (bit ?? 0), 0));
  }
  for (let pad = 0xec; words.length < capacity; pad ^= 0xec ^ 0x11) words.push(pad);
  return words;
}

/** Splits the data into blocks, adds each block's error correction and interleaves them. */
export function interleaved({ data, version }: Version & { data: number[] }): number[] {
  const blockCount = BLOCKS[version - 1] ?? 1;
  const eccLength = ECC_PER_BLOCK[version - 1] ?? 0;
  const shortLength = Math.floor(data.length / blockCount);
  const longBlocks = data.length % blockCount;
  const blocks: number[][] = [];
  for (let b = 0, at = 0; b < blockCount; b += 1) {
    const length = shortLength + (b >= blockCount - longBlocks ? 1 : 0);
    blocks.push(data.slice(at, at + length));
    at += length;
  }
  const eccs = blocks.map((block) => reedSolomonRemainder({ data: block, degree: eccLength }));
  const out: number[] = [];
  for (let i = 0; i <= shortLength; i += 1) {
    for (const block of blocks) if (i < block.length) out.push(block[i] ?? 0);
  }
  for (let i = 0; i < eccLength; i += 1) for (const ecc of eccs) out.push(ecc[i] ?? 0);
  return out;
}

type SetInput = { grid: Grid; x: number; y: number; dark: boolean };

const setFunction = ({ grid, x, y, dark }: SetInput) => {
  const row = grid.modules[y];
  const reserved = grid.reserved[y];
  if (!row || !reserved || x < 0 || x >= grid.size) return;
  row[x] = dark;
  reserved[x] = true;
};

type At = { grid: Grid; x: number; y: number };

/** A finder pattern centred at (x, y) with its light separator. */
function drawFinder({ grid, x, y }: At) {
  for (let dy = -4; dy <= 4; dy += 1) {
    for (let dx = -4; dx <= 4; dx += 1) {
      const distance = Math.max(Math.abs(dx), Math.abs(dy));
      setFunction({ grid, x: x + dx, y: y + dy, dark: distance !== 2 && distance !== 4 });
    }
  }
}

function drawAlignment({ grid, x, y }: At) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      setFunction({ grid, x: x + dx, y: y + dy, dark: Math.max(Math.abs(dx), Math.abs(dy)) !== 1 });
    }
  }
}

/** The 15 format bits (level M, the mask) in both copies, plus the dark module. */
export function drawFormat({ grid, mask }: { grid: Grid; mask: number }) {
  const data = (ECC_BITS << 3) | mask;
  let remainder = data;
  for (let i = 0; i < 10; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
  const bits = ((data << 10) | remainder) ^ 0x5412;
  const bit = ({ i }: { i: number }) => ((bits >>> i) & 1) === 1;
  const { size } = grid;
  for (let i = 0; i <= 5; i += 1) setFunction({ grid, x: 8, y: i, dark: bit({ i }) });
  setFunction({ grid, x: 8, y: 7, dark: bit({ i: 6 }) });
  setFunction({ grid, x: 8, y: 8, dark: bit({ i: 7 }) });
  setFunction({ grid, x: 7, y: 8, dark: bit({ i: 8 }) });
  for (let i = 9; i < 15; i += 1) setFunction({ grid, x: 14 - i, y: 8, dark: bit({ i }) });
  for (let i = 0; i < 8; i += 1) setFunction({ grid, x: size - 1 - i, y: 8, dark: bit({ i }) });
  for (let i = 8; i < 15; i += 1) setFunction({ grid, x: 8, y: size - 15 + i, dark: bit({ i }) });
  setFunction({ grid, x: 8, y: size - 8, dark: true });
}

/** The 18 version bits, from version 7 up, in both corners. */
function drawVersion({ grid, version }: Version & { grid: Grid }) {
  if (version < 7) return;
  let remainder = version;
  for (let i = 0; i < 12; i += 1) remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
  const bits = (version << 12) | remainder;
  for (let i = 0; i < 18; i += 1) {
    const dark = ((bits >>> i) & 1) === 1;
    const a = grid.size - 11 + (i % 3);
    const b = Math.floor(i / 3);
    setFunction({ grid, x: a, y: b, dark });
    setFunction({ grid, x: b, y: a, dark });
  }
}

/** Timing, finders, alignment and reserved format/version areas. */
export function drawFunctionPatterns({ grid, version }: Version & { grid: Grid }) {
  const { size } = grid;
  for (let i = 0; i < size; i += 1) {
    setFunction({ grid, x: 6, y: i, dark: i % 2 === 0 });
    setFunction({ grid, x: i, y: 6, dark: i % 2 === 0 });
  }
  drawFinder({ grid, x: 3, y: 3 });
  drawFinder({ grid, x: size - 4, y: 3 });
  drawFinder({ grid, x: 3, y: size - 4 });
  const positions = ALIGNMENT[version - 1] ?? [];
  const last = positions.length - 1;
  positions.forEach((x, i) => {
    positions.forEach((y, j) => {
      const corner = (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0);
      if (!corner) drawAlignment({ grid, x, y });
    });
  });
  drawFormat({ grid, mask: 0 });
  drawVersion({ grid, version });
}

/** The codewords in the zigzag order, skipping function modules. */
export function drawCodewords({ grid, codewords }: { grid: Grid; codewords: number[] }) {
  const { size } = grid;
  let index = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical += 1) {
      for (let j = 0; j < 2; j += 1) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        const row = grid.modules[y];
        if (!row || grid.reserved[y]?.[x] || index >= codewords.length * 8) continue;
        row[x] = (((codewords[index >>> 3] ?? 0) >>> (7 - (index & 7))) & 1) === 1;
        index += 1;
      }
    }
  }
}

const MASKS: ((input: { x: number; y: number }) => boolean)[] = [
  ({ x, y }) => (x + y) % 2 === 0,
  ({ y }) => y % 2 === 0,
  ({ x }) => x % 3 === 0,
  ({ x, y }) => (x + y) % 3 === 0,
  ({ x, y }) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  ({ x, y }) => ((x * y) % 2) + ((x * y) % 3) === 0,
  ({ x, y }) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  ({ x, y }) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** XORs a mask over the data modules; applying it twice undoes it. */
export function applyMask({ grid, mask }: { grid: Grid; mask: number }) {
  const test = MASKS[mask];
  if (!test) return;
  grid.modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (!grid.reserved[y]?.[x] && test({ x, y })) row[x] = !dark;
    });
  });
}
