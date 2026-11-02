import type { OperationContext } from "../../operations/types";

const MAX_PACKAGES = 100;
const MAX_VALUES = 500;

export type Named = { id: string; name: string };
export type DraftList = { name: string; values: Named[] };
export type DraftChoices = { packages: Named[]; lists: DraftList[] };

/**
 * What the model may choose from (ADR 0084 decision 3): the organization's active packages and
 * the active values of its active lists. Both are shared vocabulary (always readable), and only
 * their names go to the model.
 */
export async function loadDraftChoices({
  context,
}: {
  context: Pick<OperationContext, "db">;
}): Promise<DraftChoices> {
  const [packages, values] = await Promise.all([
    context.db.ticketTemplate.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: { id: true, name: true },
      take: MAX_PACKAGES,
    }),
    context.db.vocabularyValue.findMany({
      where: { status: "ACTIVE", vocabulary: { status: "ACTIVE" } },
      orderBy: [{ vocabularyId: "asc" }, { position: "asc" }, { id: "asc" }],
      select: { id: true, name: true, vocabulary: { select: { name: true } } },
      take: MAX_VALUES,
    }),
  ]);
  const lists = new Map<string, DraftList>();
  for (const value of values) {
    const list = lists.get(value.vocabulary.name) ?? { name: value.vocabulary.name, values: [] };
    list.values.push({ id: value.id, name: value.name });
    lists.set(list.name, list);
  }
  return { packages, lists: [...lists.values()] };
}

const same = ({ a, b }: { a: string; b: string }) =>
  a.trim().localeCompare(b.trim(), undefined, { sensitivity: "accent" }) === 0;

/** The package with exactly this name (case ignored), or null: a name not in the list is not one. */
export function matchPackage({ choices, name }: { choices: DraftChoices; name: string }) {
  return choices.packages.find((option) => same({ a: option.name, b: name })) ?? null;
}

/** The list value with this name, also written "List: Value"; null when no active value has it. */
export function matchValue({ choices, name }: { choices: DraftChoices; name: string }) {
  for (const list of choices.lists) {
    for (const value of list.values) {
      const full = `${list.name}: ${value.name}`;
      if (same({ a: value.name, b: name }) || same({ a: full, b: name })) return value;
    }
  }
  return null;
}
