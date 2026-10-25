/**
 * Text on a state's solid fill: the state's colour is the organization's own hex, so the ink is
 * picked by its brightness, dark on light fills and light on dark ones, as theme tokens.
 */
export function inkOn({ color }: { color: string }): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return "var(--foreground)";
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((at) => Number.parseInt(color.slice(at, at + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "var(--ink-on-light)" : "var(--ink-on-dark)";
}
