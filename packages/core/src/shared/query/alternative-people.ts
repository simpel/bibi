/**
 * The positive people qualifiers (`assignee:`, `follower:`, `involves:`) are alternatives of each
 * other, so `assignee:me follower:me` finds what I answer for or follow; every other qualifier
 * must hold. Shared by the order and run sheet searches so they read alike.
 */
export function withAlternativePeople<W extends { OR?: W[] }>({
  wheres,
}: {
  wheres: { where: W; people: boolean }[];
}): W[] {
  const rest = wheres.filter(({ people }) => !people).map(({ where }) => where);
  const people = wheres.filter(({ people }) => people).map(({ where }) => where);
  return people.length > 0 ? [...rest, { OR: people } as W] : rest;
}
