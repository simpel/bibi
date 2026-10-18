import { createCoreOperations, type EmbedFn } from "@okazi/core";
import en from "@okazi/i18n/messages/en.json";
import sv from "@okazi/i18n/messages/sv.json";
import { describe, expect, it } from "vitest";
import { FIELD_KEYS, fieldKey, OPERATION_KEYS, operationKey } from "./approval-labels";

const embed: EmbedFn = async ({ texts }) => ({ model: "none", embeddings: texts.map(() => []) });
const ENTITIES = ["customer", "contact", "ticket", "ticketPhase", "itemState", "line"];

describe("approval labels", () => {
  it("finds known fields and operations", () => {
    expect(fieldKey({ key: "priceMinor" })).toBe("priceMinor");
    expect(operationKey({ operation: "venue.create" })).toBe("venue_create");
    expect(operationKey({ operation: "ticket.create" })).toBe("ticket_create");
  });

  it("returns null for unknown names so the raw name is shown", () => {
    expect(fieldKey({ key: "somethingNew" })).toBeNull();
    expect(operationKey({ operation: "unknown.create" })).toBeNull();
  });

  it.each([
    ["en", en],
    ["sv", sv],
  ])("keeps the %s field labels in sync with FIELD_KEYS", (_locale, messages) => {
    const labelled = Object.keys(messages.assistant.approval.fields).sort();
    expect(labelled).toEqual([...FIELD_KEYS].sort());
  });

  it.each([
    ["en", en],
    ["sv", sv],
  ])("keeps the %s operation labels in sync with OPERATION_KEYS", (_locale, messages) => {
    const labelled = Object.keys(messages.assistant.approval.operations).sort();
    expect(labelled).toEqual([...OPERATION_KEYS].sort());
  });

  it("labels every write operation of customer, contact, ticket, phase, item state and line", () => {
    const writes = createCoreOperations({ embed })
      .filter((op) => op.kind === "command" && ENTITIES.includes(op.name.split(".")[0] ?? ""))
      .map((op) => op.name);
    expect(writes.length).toBeGreaterThan(0);
    for (const operation of writes) expect(operationKey({ operation })).not.toBeNull();
  });
});
