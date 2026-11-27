import type { OperationContext } from "../../operations/types";
import { PAGE_INCLUDE, toPageDto } from "../booking-page/operations";

type Ctx = { context: Pick<OperationContext, "db"> };

/** The booking page's guest lists with their active values, in the page's order (ADR 0119). */
export async function loadGuestLists({ context, ids }: Ctx & { ids: readonly string[] }) {
  if (ids.length === 0) return [];
  const lists = await context.db.vocabulary.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      values: {
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { position: "asc" },
      },
    },
  });
  const byId = new Map(lists.map((list) => [list.id, list]));
  return ids.flatMap((id) => {
    const list = byId.get(id);
    return list ? [{ name: list.name, values: list.values }] : [];
  });
}

/** The value ids guests may count: the active values of the page's guest lists. */
export async function guestValueIds({ context }: Ctx): Promise<ReadonlySet<string>> {
  const page = toPageDto({
    row: await context.db.bookingPage.findFirst({ include: PAGE_INCLUDE }),
  });
  const lists = await loadGuestLists({ context, ids: page.guestListIds });
  return new Set(lists.flatMap((list) => list.values.map((value) => value.id)));
}
