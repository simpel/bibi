import { allBlockers, countBlocker } from "../../archive/blockers";
import { EITHER_STATUS, type KindInput } from "../../archive/lifecycle-kind";

/** Lines the type still has outside its records: packages and order versions. */
const snapshotLines = ({ context, id }: KindInput) =>
  Promise.all([
    context.db.orderTemplateLine.count({ where: { entityTypeId: id } }),
    context.db.orderVersionLine.count({ where: { entityTypeId: id } }),
  ]).then(([template, version]) => template + version);

/** Other configuration that names the type: boards, inbox addresses, demands, link fields. */
const namedBy = ({ context, id }: KindInput) =>
  Promise.all([
    context.db.board.count({ where: { entityTypeId: id, status: EITHER_STATUS } }),
    context.db.inboundEndpoint.count({ where: { defaultEntityTypeId: id, status: EITHER_STATUS } }),
    context.db.itemDemand.count({ where: { entityTypeId: id, status: EITHER_STATUS } }),
    context.db.fieldDefinition.count({
      where: { linkTypeId: id, entityTypeId: { not: id }, status: EITHER_STATUS },
    }),
  ]).then((counts) => counts.reduce((sum, n) => sum + n, 0));

/** Active responsibilities and run sheet templates that still list the type or its fields. */
const listedBy = ({ context, id }: KindInput) => [
  countBlocker({
    count: context.db.responsibilityEntityType.count({
      where: { entityTypeId: id, responsibility: { status: "ACTIVE" } },
    }),
    ...{ feature: "responsibility", path: "responsibilities", what: "responsibilities" },
  }),
  countBlocker({
    count: Promise.all([
      context.db.runSheetDefinitionEntityType.count({
        where: { entityTypeId: id, runSheetDefinition: { status: "ACTIVE" } },
      }),
      context.db.runSheetDefinitionField.count({
        where: { field: { entityTypeId: id }, runSheetDefinition: { status: "ACTIVE" } },
      }),
    ]).then(([types, fields]) => types + fields),
    ...{ feature: "template", path: "runSheetDefinitions", what: "run sheet templates" },
  }),
];

/**
 * What still refers to a type (ADR 0118): any record of it, archived or not (items, customers,
 * orders, lines, tasks...), lines in packages and order versions, and the configuration that
 * names it. Its own fields, states and grid cells go with it.
 */
export const entityTypeDeleteBlockers = ({ context, id }: KindInput) =>
  allBlockers({
    checks: [
      countBlocker({
        count: context.db.record.count({ where: { entityTypeId: id, status: EITHER_STATUS } }),
        ...{ feature: "configuration", path: "records", what: "records of this type" },
      }),
      countBlocker({
        count: snapshotLines({ context, id }),
        ...{ feature: "configuration", path: "lines", what: "package or order version lines" },
      }),
      countBlocker({
        count: namedBy({ context, id }),
        ...{
          feature: "configuration",
          path: "configuration",
          what: "boards, addresses, demands or fields",
        },
      }),
      ...listedBy({ context, id }),
    ],
  });
