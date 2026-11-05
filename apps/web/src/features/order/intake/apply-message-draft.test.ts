import type { OrderDraft } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { applyMessageDraft } from "./apply-message-draft";
import { reduceIntake } from "./intake-reducer";
import { initialIntake } from "./intake-state";

const said = ({ value, guessed = false }: { value: string; guessed?: boolean }) => ({
  value,
  quote: guessed ? "" : value,
  guessed,
});

const draft: OrderDraft = {
  ...{ sender: said({ value: "Anna Berg" }), company: said({ value: "Hisingen Energi" }) },
  ...{ email: null, phone: null },
  date: { value: "2026-11-21", asWritten: "21 Nov", quote: "21 Nov", guessed: false },
  start: {
    value: new Date("2026-11-21T14:00:00Z"),
    asWritten: "3 pm",
    quote: "3 pm",
    guessed: false,
  },
  end: { value: new Date("2026-11-21T16:00:00Z"), asWritten: "", quote: "", guessed: true },
  headcount: { value: 14, quote: "14", guessed: false },
  wish: said({ value: "A wine tasting" }),
  package: said({ value: "Wine tasting" }),
  needs: [{ value: "Vegan", count: 2, vocabularyValueId: "v1", quote: "vegan", guessed: false }],
  notes: null,
  ...{ customerId: null, contactId: null, templateId: "tpl1", inboundMessageId: null },
  timeZone: "Europe/Stockholm",
};

const display = {
  timeZone: "Europe/Stockholm",
  day: ({ iso }: { iso: string }) => iso,
  time: ({ instant }: { instant: Date }) => instant.toISOString().slice(11, 16),
};

const read = ({ matched }: { matched: boolean }) =>
  applyMessageDraft({
    result: matched
      ? { draft, customer: { id: "c1", name: "HE" }, contact: { id: "p1", name: "Anna" } }
      : { draft, customer: null, contact: null },
    ...{ display, needsLabel: "Needs" },
  });

describe("applyMessageDraft (ADR 0084)", () => {
  it("prefills step 2, the search, the package, the note, and asks about guesses", () => {
    const applied = read({ matched: false });
    expect(applied.who).toBeNull();
    expect(applied.when).toEqual({ date: "2026-11-21", from: "15:00", to: "17:00", guests: "14" });
    expect(applied.search).toBe("Hisingen Energi");
    expect(applied.templateId).toBe("tpl1");
    expect(applied.note).toBe("A wine tasting\nNeeds: Vegan × 2");
    expect(applied.guesses).toEqual([{ key: "end.0", field: "end", value: "16:00", step: "when" }]);
  });

  it("preselects a matched customer and contact instead of searching", () => {
    const applied = read({ matched: true });
    expect(applied.who).toEqual({
      ...{ customerId: "c1", customerName: "HE", contactId: "p1", contactName: "Anna" },
    });
    expect(applied.search).toBeNull();
  });

  it("prefills without completing: the steps start over at step 1", () => {
    const who = { customerId: "c9", customerName: "Old", contactId: "p9", contactName: "Bo" };
    const state = { ...initialIntake({ intakeKey: "k" }), who, open: "when" as const };
    const next = reduceIntake({
      state,
      action: { type: "applyDraft", draft: read({ matched: true }) },
    });
    expect(next.open).toBe("who");
    expect(next.who).toBeNull();
    expect(next.when).toBeNull();
    expect(next.pick).toBeNull();
    expect(next.draft?.who?.contactId).toBe("p1");
    expect(next.intakeKey).toBe("k");
  });
});
