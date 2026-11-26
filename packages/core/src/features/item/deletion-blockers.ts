import { allBlockers, countBlocker } from "../../archive/blockers";
import { EITHER_STATUS, type KindInput } from "../../archive/lifecycle-kind";

/**
 * What still refers to an item (ADR 0118), archived or not: lines and their snapshots (quotes,
 * order versions), allocations of it as a unit, packages, tasks, and other items that use it as a
 * part, an option or a demand target. Its own parts, options and demands go with it.
 */
export function itemDeleteBlockers({ context, id }: KindInput) {
  const { db } = context;
  const notOwn = { not: id };
  return allBlockers({
    checks: [
      countBlocker({
        count: db.line.count({ where: { itemId: id, status: EITHER_STATUS } }),
        ...{ feature: "program", path: "lines", what: "order lines" },
      }),
      countBlocker({
        count: db.lineAllocation.count({ where: { unitId: id, status: EITHER_STATUS } }),
        ...{ feature: "program", path: "allocations", what: "allocations" },
      }),
      countBlocker({
        count: db.orderVersionLine.count({ where: { itemId: id } }),
        ...{ feature: "order", path: "orderVersions", what: "order version lines" },
      }),
      countBlocker({
        count: db.orderLine.count({ where: { itemId: id } }),
        ...{ feature: "quote", path: "documents", what: "quote or invoice lines" },
      }),
      countBlocker({
        count: Promise.all([
          db.orderTemplateLine.count({ where: { itemId: id } }),
          db.orderTemplateLineOption.count({ where: { itemId: id } }),
        ]).then(([lines, options]) => lines + options),
        ...{ feature: "orderTemplate", path: "packages", what: "package lines" },
      }),
      countBlocker({
        count: db.taskItem.count({ where: { itemId: id } }),
        ...{ feature: "task", path: "tasks", what: "tasks" },
      }),
      countBlocker({
        count: Promise.all([
          db.itemPart.count({ where: { partId: id, parentId: notOwn } }),
          db.itemCustomisationOption.count({ where: { itemId: id, group: { itemId: notOwn } } }),
          db.itemDemand.count({
            where: { targetItemId: id, itemId: notOwn, status: EITHER_STATUS },
          }),
        ]).then((counts) => counts.reduce((sum, n) => sum + n, 0)),
        ...{ feature: "item", path: "items", what: "other items (parts, options, demands)" },
      }),
    ],
  });
}
