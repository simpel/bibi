import { describe, expect, it } from "vitest";
import {
  RECORD_INTENT_KEY,
  type RecordIntent,
  withRecordIntent,
} from "../src/scoped/record-intent";

const intent: RecordIntent = { kind: "engine", purpose: "capacity" };

function fakeClient() {
  return {
    order: { findMany: (args: unknown) => args, count: (args: unknown) => args },
    $transaction: (fn: (tx: unknown) => unknown) => fn("tx"),
    $findRecords: (args: unknown) => args,
  };
}

describe("withRecordIntent (ADR 0113)", () => {
  it("adds the intent to every model query and exposes only model delegates", () => {
    const view = withRecordIntent({ client: fakeClient(), intent });
    expect(view.order.findMany({ where: { id: "a" } })).toEqual({
      where: { id: "a" },
      [RECORD_INTENT_KEY]: intent,
    });
    expect(view.order.count(undefined)).toEqual({ [RECORD_INTENT_KEY]: intent });
    expect("$transaction" in view).toBe(false);
    expect("$findRecords" in view).toBe(false);
  });
});
