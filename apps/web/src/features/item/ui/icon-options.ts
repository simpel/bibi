import { iconNames } from "lucide-react/dynamic";

/** Icons a venue's items often need, offered before anything is typed. */
const COMMON = [
  "presentation",
  "armchair",
  "sofa",
  "bed-double",
  "coffee",
  "utensils",
  "cake-slice",
  "salad",
  "wine",
  "beer",
  "martini",
  "glass-water",
  "mic",
  "speaker",
  "projector",
  "monitor",
  "users",
  "music",
  "sparkles",
  "trees",
  "ship",
  "bus",
  "car",
  "gift",
] as const;

const KNOWN = new Set<string>(iconNames);

/** Most icons the grid shows at once. */
export const MAX_ICON_OPTIONS = 40;

export type IconOptionsInput = {
  /** What staff typed in the search box. */
  query: string;
  /** The item's name: its words suggest icons before anything is typed. */
  name: string;
};

/**
 * The icons to offer: matches for the search, else icons named like a word of the item's name
 * followed by the common ones. Only names this Lucide build has.
 */
export function iconOptions({ query, name }: IconOptionsInput): string[] {
  const search = query.trim().toLowerCase();
  if (search) return iconNames.filter((icon) => icon.includes(search)).slice(0, MAX_ICON_OPTIONS);
  const words = name
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((word) => word.length >= 3);
  const exact = words.filter((word) => KNOWN.has(word));
  const fromName = iconNames.filter((icon) => words.some((word) => icon.startsWith(word)));
  const common = COMMON.filter((icon) => KNOWN.has(icon));
  const suggested = [...exact, ...fromName].slice(0, 8);
  return [...new Set([...suggested, ...common])].slice(0, MAX_ICON_OPTIONS);
}
