// Tests for rename-ticket-to-order.mjs: node --test tools/rename-ticket-to-order.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { SWEDISH_TICKET_PAIRS } from "./lib/rename-swedish.mjs";
import { replacePairs, TICKET_PAIRS } from "./lib/rename-tokens.mjs";

test("TICKET_PAIRS replaces PascalCase models, statuses and templates", () => {
  const input = `
    import type { Ticket, TicketStatus, TicketTemplate, TicketDraft } from "@bibi/db";
    const statusChange: TicketStatusChange = row;
    const gate: TicketStatusGate = row;
    const est: TicketEstimate = row;
  `;
  const { output } = replacePairs({ text: input, pairs: TICKET_PAIRS });
  assert.ok(
    output.includes(
      'import type { Order, OrderStatus, OrderTemplate, OrderDraft } from "@bibi/db";',
    ),
  );
  assert.ok(output.includes("const statusChange: OrderStatusChange = row;"));
  assert.ok(output.includes("const gate: OrderStatusGate = row;"));
  assert.ok(output.includes("const est: OrderEstimate = row;"));
});

test("TICKET_PAIRS replaces camelCase identifiers and methods", () => {
  const input = `
    const ticketId = row.ticketId;
    const statusId = row.ticketStatusId;
    if (input.ticketStatus) {
      updateTicket({ ticketId, customerId });
    }
  `;
  const { output } = replacePairs({ text: input, pairs: TICKET_PAIRS });
  assert.ok(output.includes("const orderId = row.orderId;"));
  assert.ok(output.includes("const statusId = row.orderStatusId;"));
  assert.ok(output.includes("if (input.orderStatus) {"));
  assert.ok(output.includes("updateOrder({ orderId, customerId });"));
});

test("TICKET_PAIRS does not corrupt OrderLine", () => {
  const input = `
    import type { OrderLine, Ticket } from "@bibi/db";
    const line: OrderLine = row;
    const orderLineId = line.id;
  `;
  const { output } = replacePairs({ text: input, pairs: TICKET_PAIRS });
  assert.ok(output.includes('import type { OrderLine, Order } from "@bibi/db";'));
  assert.ok(output.includes("const line: OrderLine = row;"));
  assert.ok(output.includes("const orderLineId = line.id;"));
});

test("TICKET_PAIRS replaces kebab-case and SCREAMING_SNAKE", () => {
  const input = `
    const feature = "ticket";
    const statusFeature = "ticket-status";
    const templateFeature = "ticket-template";
    const base = "TICKET";
  `;
  const { output } = replacePairs({ text: input, pairs: TICKET_PAIRS });
  assert.ok(output.includes('const feature = "order";'));
  assert.ok(output.includes('const statusFeature = "order-status";'));
  assert.ok(output.includes('const templateFeature = "order-template";'));
  assert.ok(output.includes('const base = "ORDER";'));
});

test("SWEDISH_TICKET_PAIRS replaces Swedish grammatical cases", () => {
  const input = `
    "ticket": {
      "singular": "Ärende",
      "plural": "Ärenden"
    },
    "changeStatus": "Byt ärendestatus",
    "editDescription": "Ändra uppgifterna för ärendet.",
    "archiveConfirm": "Arkivera även kundens alla ärenden",
    "details": "Ärendets detaljer",
    "rules": "Ärendenas ordning",
    "one": "ett ärende utan titel"
  `;
  const { output } = replacePairs({
    text: input,
    pairs: [...SWEDISH_TICKET_PAIRS, ...TICKET_PAIRS],
  });
  assert.ok(output.includes('"singular": "Bokning"'));
  assert.ok(output.includes('"plural": "Bokningar"'));
  assert.ok(output.includes('"changeStatus": "Byt bokningsstatus"'));
  assert.ok(output.includes('"editDescription": "Ändra uppgifterna för bokningen."'));
  assert.ok(output.includes('"archiveConfirm": "Arkivera även kundens alla bokningar"'));
  assert.ok(output.includes('"details": "Bokningens detaljer"'));
  assert.ok(output.includes('"rules": "Bokningarnas ordning"'));
  assert.ok(output.includes('"one": "en bokning utan titel"'));
});
