type Modules = readonly (readonly boolean[])[];

/** Runs of five or more same-coloured modules in a line: 3 points, plus 1 per extra module. */
function runPenalty({ line }: { line: readonly boolean[] }): number {
  let score = 0;
  let run = 1;
  for (let i = 1; i <= line.length; i += 1) {
    if (i < line.length && line[i] === line[i - 1]) run += 1;
    else {
      if (run >= 5) score += run - 2;
      run = 1;
    }
  }
  return score;
}

const FINDER_LIKE = [
  [true, false, true, true, true, false, true, false, false, false, false],
  [false, false, false, false, true, false, true, true, true, false, true],
];

/** 1:1:3:1:1 patterns with four light modules on one side: 40 points each. */
function finderPenalty({ line }: { line: readonly boolean[] }): number {
  let score = 0;
  for (let i = 0; i + 11 <= line.length; i += 1) {
    if (FINDER_LIKE.some((pattern) => pattern.every((dark, j) => line[i + j] === dark))) {
      score += 40;
    }
  }
  return score;
}

/** 2×2 blocks of one colour: 3 points each. */
function blockPenalty({ modules }: { modules: Modules }): number {
  let score = 0;
  for (let y = 0; y + 1 < modules.length; y += 1) {
    for (let x = 0; x + 1 < modules.length; x += 1) {
      const dark = modules[y]?.[x];
      const same = [modules[y]?.[x + 1], modules[y + 1]?.[x], modules[y + 1]?.[x + 1]];
      if (same.every((other) => other === dark)) score += 3;
    }
  }
  return score;
}

/** The ISO 18004 mask penalty: lower is easier to scan. */
export function qrPenalty({ modules }: { modules: Modules }): number {
  const size = modules.length;
  const columns = Array.from({ length: size }, (_, x) => modules.map((row) => row[x] ?? false));
  const lines = [...modules, ...columns];
  const lineScore = lines.reduce(
    (sum, line) => sum + runPenalty({ line }) + finderPenalty({ line }),
    0,
  );
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const balance = Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
  return lineScore + blockPenalty({ modules }) + balance;
}
