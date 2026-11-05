/** The five categorical colors a type badge can take (`Badge`'s `hue`). */
export type TypeHue = 1 | 2 | 3 | 4 | 5;

export type TypeHuesInput = { typeNames: readonly string[] };

/**
 * A stable color per item type: types are sorted by name and take the five hues in turn, so a
 * type keeps its color wherever the same catalog is shown (a sixth type repeats the first hue).
 */
export function typeHues({ typeNames }: TypeHuesInput): ReadonlyMap<string, TypeHue> {
  const sorted = [...new Set(typeNames)].sort((a, b) => a.localeCompare(b));
  return new Map(sorted.map((name, index) => [name, ((index % 5) + 1) as TypeHue]));
}
