import type { TicketDraft } from "@bibi/core";
import { describe, expect, it } from "vitest";
import { applyMessageDraft } from "./apply-message-draft";
import { reduceIntake } from "./intake-reducer";
import { initialIntake } from "./intake-state";

const said = ({ value, guessed = false }: { value: string; guessed?: boolean }) => ({
  value,
  quote: guessed ? "" : value,
  guessed,
});

const draft: TicketDraft = {
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

describe("applyMessageDraft (ADR 0084)", () => {
  it("fills step 2, prefills the search, suggests the package and asks about guesses", () => {
    const result = { draft, customer: null, contact: null };
    const applied = applyMessageDraft({ result, display, needsLabel: "Needs" });
    expect(applied.who).toBeNull();
    expect(applied.when).toEqual({ date: "2026-11-21", from: "15:00", to: "17:00", guests: 14 });
    expect(applied.draft.search).toBe("Hisingen Energi");
    expect(applied.draft.templateId).toBe("tpl1");
    expect(applied.draft.fromMessage).toEqual(["when", "package"]);
    expect(applied.draft.note).toBe("A wine tasting\nNeeds: Vegan × 2");
    expect(applied.draft.guesses).toEqual([
      { key: "end.0", field: "end", value: "16:00", step: "when" },
    ]);
  });

  it("opens step 1 when no customer matched, and step 3 when it did", () => {
    const state = initialIntake({ intakeKey: "k", fromMessage: true });
    expect(state.open).toBe("message");
    const without = applyMessageDraft({
      result: { draft, customer: null, contact: null },
      ...{ display, needsLabel: "Needs" },
    });
    expect(reduceIntake({ state, action: { type: "applyDraft", ...without } }).open).toBe("who");
    const matched = applyMessageDraft({
      result: { draft, customer: { id: "c1", name: "HE" }, contact: { id: "p1", name: "Anna" } },
      ...{ display, needsLabel: "Needs" },
    });
    const next = reduceIntake({ state, action: { type: "applyDraft", ...matched } });
    expect(next.open).toBe("package");
    expect(next.who?.contactId).toBe("p1");
  });
});
