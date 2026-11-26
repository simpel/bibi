import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import { checkReadable } from "../order/order-rules";
import type { TableCombinationInput } from "./schema";

type Ctx = { context: Pick<OperationContext, "db" | "permissions"> };

/** The layout exists, the caller may read items, and returns the ids of its seated pieces. */
export async function layoutTables({
  context,
  layoutId,
}: Ctx & { layoutId: string }): Promise<Result<ReadonlySet<string>>> {
  const readable = checkReadable({ context, permission: "item:read", path: "layoutId" });
  if (!readable.ok) return readable;
  const layout = await context.db.setupLayout.findFirst({
    where: { id: layoutId },
    select: { elements: { select: { id: true, kind: { select: { shape: true, fixed: true } } } } },
  });
  if (!layout) return notFound({ entity: "Layout" });
  const seated = layout.elements.filter(
    (piece) => !piece.kind.fixed && (piece.kind.shape === "ROUND" || piece.kind.shape === "RECT"),
  );
  return ok({ value: new Set(seated.map((piece) => piece.id)) });
}

export type CheckCombinationsInput = {
  tables: ReadonlySet<string>;
  combinations: readonly TableCombinationInput[];
};

/** Every member is a table of the layout, limits are in order and names are unique. */
export function checkCombinations({ tables, combinations }: CheckCombinationsInput): Result<true> {
  const issues: AppErrorIssue[] = [];
  const names = new Set<string>();
  combinations.forEach((combination, index) => {
    const name = combination.name.toLowerCase();
    if (names.has(name))
      issues.push({ path: `combinations.${index}.name`, message: "Two combinations share a name" });
    names.add(name);
    if (combination.elementIds.some((id) => !tables.has(id)))
      issues.push({
        path: `combinations.${index}.elementIds`,
        message: "Only tables (seated pieces) of this layout can be combined",
      });
    const { minCovers, maxCovers } = combination;
    if (minCovers !== null && maxCovers !== null && maxCovers < minCovers)
      issues.push({ path: `combinations.${index}.maxCovers`, message: "Most is below fewest" });
  });
  return issues.length > 0
    ? invalid({ message: issues[0]?.message ?? "Invalid combination", issues })
    : ok({ value: true });
}
