import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { buildRunSheetContent } from "./build-content";
import { checkSourcesReadable } from "./check-sources-readable";
import { fulfillRunSheet, unfulfillRunSheet } from "./fulfill-operation";
import { loadRunSheetPage } from "./list-page";
import { RunSheetListInputSchema, RunSheetListOutputSchema } from "./list-schema";
import { loadMatches } from "./load-matches";
import { loadSources } from "./load-sources";
import { publishRunSheet, sendRunSheet } from "./publish-operation";
import { RunSheetGenerateInputSchema, RunSheetIdInputSchema, RunSheetSchema } from "./schema";
import { toRunSheetDto, RUN_SHEET_INCLUDE } from "./to-run-sheet-dto";
import { createVersion, findVersions, sameAsLatest } from "./versions";

export const listRunSheets = defineOperation({
  name: "runSheet.list",
  kind: "query",
  description:
    "List generated run sheet versions (e.g. kitchen orders), newest first: version, whether it " +
    "is the current one, receiving responsibility, the rows of the snapshot, the changes marked ★ " +
    "since the last sent version and when it was sent. Filter by order, run sheet definition " +
    "or a window over the order's period (`from`/`to`); search with `q` (`involves:me " +
    "is:current` = my current run sheets) and order with `sort`/`direction`. Page with " +
    "`cursor`, or with `page` to get numbered pages and the `total` count.",
  input: RunSheetListInputSchema,
  output: RunSheetListOutputSchema,
  permission: "runSheet:read",
  handler: async ({ input, context }) => ok({ value: await loadRunSheetPage({ input, context }) }),
});

export const getRunSheet = defineOperation({
  name: "runSheet.get",
  kind: "query",
  description: "Get one run sheet version by id, with its rows and the changes marked ★.",
  input: RunSheetIdInputSchema,
  output: RunSheetSchema,
  permission: "runSheet:read",
  handler: async ({ input, context }) => {
    const row = await context.db.runSheet.findFirst({
      where: { id: input.id },
      include: RUN_SHEET_INCLUDE,
    });
    return row ? ok({ value: toRunSheetDto({ row }) }) : notFound({ entity: "RunSheet" });
  },
});

export const generateRunSheet = defineOperation({
  name: "runSheet.generate",
  kind: "command",
  description:
    "Generate the run sheet of an order from a run sheet definition (e.g. the kitchen order): a " +
    "snapshot of the order's items and counts that the definition includes. A changed " +
    "order gives the next version, with the changed rows marked ★ against the last SENT " +
    "version; an unchanged order returns the latest version. Sending is a separate step " +
    "(runSheet.send). Needs order:read, program:read and item:read (the rows are copied from them).",
  input: RunSheetGenerateInputSchema,
  output: RunSheetSchema,
  permission: "runSheet:write",
  handler: async ({ input: { orderId, runSheetDefinitionId }, context }) => {
    const readable = checkSourcesReadable({ context });
    if (!readable.ok) return readable;
    const sources = await loadSources({ context, orderId, runSheetDefinitionId });
    if (!sources.ok) return sources;
    const { order, definition } = sources.value;
    const { latest, sent } = await findVersions({ context, orderId, runSheetDefinitionId });
    const content = await buildRunSheetContent({ context, order, definition });
    const matches = await loadMatches({ context, orderId, definition });
    if (latest && sameAsLatest({ latest, content, matches, definition })) {
      return ok({ value: toRunSheetDto({ row: latest }) });
    }
    const row = await createVersion({
      context,
      order,
      definition,
      content,
      matches,
      latest,
      sent,
    });
    const runSheet = toRunSheetDto({ row });
    context.recordChange({ entityId: row.id, after: runSheet });
    return ok({ value: runSheet });
  },
});

export { fulfillRunSheet, publishRunSheet, sendRunSheet, unfulfillRunSheet };

export const runSheetOperations = [
  listRunSheets,
  getRunSheet,
  generateRunSheet,
  publishRunSheet,
  sendRunSheet,
  fulfillRunSheet,
  unfulfillRunSheet,
];
