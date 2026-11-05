// Tests for rename-work-order-to-run-sheet.mjs: node --test tools/rename-work-order-to-run-sheet.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { SWEDISH_WORK_ORDER_PAIRS } from "./lib/rename-swedish.mjs";
import { replacePairs, WORK_ORDER_PAIRS } from "./lib/rename-tokens.mjs";

test("WORK_ORDER_PAIRS replaces PascalCase models and definitions", () => {
  const input = `
    import type { WorkOrder, WorkOrderDefinition, WorkOrderRecipient } from "@bibi/db";
    const status: WorkOrderStatus = "DRAFT";
    type Change = WorkOrderChange;
    type Match = WorkOrderMatch;
  `;
  const { output } = replacePairs({ text: input, pairs: WORK_ORDER_PAIRS });
  assert.ok(output.includes('import type { RunSheet, RunSheetDefinition, RunSheetRecipient } from "@bibi/db";'));
  assert.ok(output.includes('const status: RunSheetStatus = "DRAFT";'));
  assert.ok(output.includes("type Change = RunSheetChange;"));
  assert.ok(output.includes("type Match = RunSheetMatch;"));
});

test("WORK_ORDER_PAIRS replaces camelCase and identifiers", () => {
  const input = `
    const workOrderId = row.workOrderId;
    const def = row.workOrderDefinitionId;
    if (itemState.inWorkOrders) {
      listWorkOrders({ workOrderDefinitionId: def });
    }
  `;
  const { output } = replacePairs({ text: input, pairs: WORK_ORDER_PAIRS });
  assert.ok(output.includes("const runSheetId = row.runSheetId;"));
  assert.ok(output.includes("const def = row.runSheetDefinitionId;"));
  assert.ok(output.includes("if (itemState.inRunSheets) {"));
  assert.ok(output.includes("listRunSheets({ runSheetDefinitionId: def });"));
});

test("WORK_ORDER_PAIRS replaces kebab-case and SCREAMING_SNAKE", () => {
  const input = `
    const feature = "work-order";
    const def = "work-order-definition";
    const env = WORK_ORDER_MAX;
  `;
  const { output } = replacePairs({ text: input, pairs: WORK_ORDER_PAIRS });
  assert.ok(output.includes('const feature = "run-sheet";'));
  assert.ok(output.includes('const def = "run-sheet-definition";'));
  assert.ok(output.includes("const env = RUN_SHEET_MAX;"));
});

test("WORK_ORDER_PAIRS replaces English prose and strings", () => {
  const input = `
    "Work orders that reach the right person"
    "A work order such as the kitchen order"
    "Every work order version, newest first."
  `;
  const { output } = replacePairs({ text: input, pairs: WORK_ORDER_PAIRS });
  assert.ok(output.includes('"Run sheets that reach the right person"'));
  assert.ok(output.includes('"A run sheet such as the kitchen order"'));
  assert.ok(output.includes('"Every run sheet version, newest first."'));
});

test("SWEDISH_WORK_ORDER_PAIRS replaces Swedish translations for work orders", () => {
  const input = `
    "workOrder": {
      "singular": "Order",
      "plural": "Order"
    },
    "workOrderDefinition": {
      "singular": "Order",
      "plural": "Order"
    },
    "openWorkOrder": "Öppna ordern",
    "aWorkOrder": "en order",
    "inWorkOrders": "Med i order"
  `;
  const { output } = replacePairs({
    text: input,
    pairs: [...SWEDISH_WORK_ORDER_PAIRS, ...WORK_ORDER_PAIRS],
  });
  assert.ok(output.includes('"singular": "Körschema"'));
  assert.ok(output.includes('"plural": "Körscheman"'));
  assert.ok(output.includes('"openRunSheet": "Öppna körschemat"'));
  assert.ok(output.includes('"aRunSheet": "ett körschema"'));
  assert.ok(output.includes('"inRunSheets": "Med i körschema"'));
});

test("SWEDISH_WORK_ORDER_PAIRS replaces Swedish definitions", () => {
  const input = "Orderdefinitioner, till exempel köksordern, och vem som får dem.";
  const { output } = replacePairs({
    text: input,
    pairs: [...SWEDISH_WORK_ORDER_PAIRS, ...WORK_ORDER_PAIRS],
  });
  assert.ok(output.includes("Körschemadefinitioner, till exempel kökskörschemat, och vem som får dem."));
});
