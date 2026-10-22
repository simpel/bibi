import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

/** `?mine=` on the ticket list (ADR 0034). */
export const MINE_FILTERS = ["assigned", "following"] as const;
export type MineFilter = (typeof MINE_FILTERS)[number];

export type ReadMineInput = { value: string | string[] | undefined };

/** The `mine` search param, or undefined for everything. */
export function readMine({ value }: ReadMineInput): MineFilter | undefined {
  const first = Array.isArray(value) ? value[0] : value;
  return MINE_FILTERS.find((filter) => filter === first);
}

export type MineListInput = { mine: MineFilter | undefined; userId: string | null };

/** The list operation's filter for the signed-in member: `assigneeId` or `followerId`. */
export function mineListInput({ mine, userId }: MineListInput) {
  if (!mine || !userId) return {};
  return mine === "assigned" ? { assigneeId: userId } : { followerId: userId };
}

export type MinePageInput = MineListInput & { limit: number; cursor: string | undefined };

/** A list page's input: limit, cursor and the `mine` filter. */
export const minePageInput = ({ limit, cursor, ...mine }: MinePageInput) => ({
  limit,
  ...(cursor ? { cursor } : {}),
  ...mineListInput(mine),
});

export type MineFilterLinksProps = { pathname: string; mine: MineFilter | undefined };

/** All, Assigned to me and Following, as links that keep the list's own route. */
export async function MineFilterLinks({ pathname, mine }: MineFilterLinksProps) {
  const t = await getTranslations("assignment.filter");
  const options = [
    { key: undefined, label: t("all") },
    { key: "assigned" as const, label: t("assigned") },
    { key: "following" as const, label: t("following") },
  ];
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {options.map(({ key, label }) => (
        <Button key={label} asChild size="sm" variant={key === mine ? "secondary" : "ghost"}>
          <Link href={{ pathname, query: key ? { mine: key } : {} }}>{label}</Link>
        </Button>
      ))}
    </nav>
  );
}
