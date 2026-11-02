import { describe, expect, it } from "vitest";
import { reduceIntake } from "./intake-reducer";
import {
  type IntakeAction,
  type IntakeState,
  type IntakeWhen,
  initialIntake,
  stepView,
} from "./intake-state";

const who = { customerId: "c1", customerName: "Volvo", contactId: "p1", contactName: "Anna" };
const when: IntakeWhen = { date: "2026-11-20", from: "09:00", to: "12:00", guests: 12 };
const pkg = { kind: "PACKAGE", templateId: "t1", name: "Half day", answers: {} } as const;

const INITIAL_INTAKE = initialIntake({ intakeKey: "k1" });
const done: IntakeAction = { type: "completePackage", lines: [], plannedStart: null };

const run = ({ actions, from = INITIAL_INTAKE }: { actions: IntakeAction[]; from?: IntakeState }) =>
  actions.reduce((state, action) => reduceIntake({ state, action }), from);

const complete = run({
  actions: [{ type: "setWho", who }, { type: "setWhen", when }, { type: "pick", pick: pkg }, done],
});

describe("reduceIntake", () => {
  it("opens the steps in order and reaches review", () => {
    const afterWho = run({ actions: [{ type: "setWho", who }] });
    expect(afterWho.open).toBe("when");
    expect(stepView({ state: afterWho, step: "who" })).toBe("done");
    expect(stepView({ state: afterWho, step: "package" })).toBe("locked");
    expect(complete.open).toBe("review");
  });

  it("keeps step 3 open after a pick until it is completed", () => {
    const picked = run({
      actions: [
        { type: "setWho", who },
        { type: "setWhen", when },
        { type: "pick", pick: pkg },
      ],
    });
    expect(picked.open).toBe("package");
    expect(picked.pick).toEqual(pkg);
  });

  it("applies the answers' period with the pick", () => {
    const moved = { ...when, from: "13:00", to: "16:00" };
    const state = run({ actions: [{ type: "pick", pick: pkg, when: moved }], from: complete });
    expect(state.when).toEqual(moved);
  });

  it("does not complete step 3 without a pick", () => {
    const state = run({
      actions: [{ type: "setWho", who }, { type: "setWhen", when }, done],
    });
    expect(state.open).toBe("package");
  });

  it("reopens a done step with Change and keeps later answers", () => {
    const changed = run({ actions: [{ type: "change", step: "who" }], from: complete });
    expect(changed.open).toBe("who");
    expect(changed.when).toEqual(when);
    expect(stepView({ state: changed, step: "package" })).toBe("done");
    const other = { ...who, customerId: "c2", customerName: "Saab" };
    expect(run({ actions: [{ type: "setWho", who: other }], from: changed }).open).toBe("review");
  });

  it("keeps the package when the period is saved unchanged", () => {
    const state = run({
      actions: [
        { type: "change", step: "when" },
        { type: "setWhen", when },
      ],
      from: complete,
    });
    expect(state.pick).toEqual(pkg);
    expect(state.open).toBe("review");
  });

  it("drops a package's answers when the period changes, but keeps a one-off", () => {
    const later = { ...when, from: "10:00" };
    const unreviewed = { ...complete, review: null };
    const dropped = run({ actions: [{ type: "setWhen", when: later }], from: unreviewed });
    expect(dropped.pick).toBeNull();
    expect(dropped.open).toBe("package");
    const oneOff = { ...unreviewed, pick: { kind: "ONE_OFF" } as const };
    expect(run({ actions: [{ type: "setWhen", when: later }], from: oneOff }).pick).toEqual({
      kind: "ONE_OFF",
    });
  });

  it("unpicks, restores and resets", () => {
    expect(run({ actions: [{ type: "unpick" }], from: complete }).pick).toBeNull();
    expect(run({ actions: [{ type: "restore", state: complete }] })).toEqual(complete);
    expect(run({ actions: [{ type: "reset", intakeKey: "k2" }], from: complete })).toEqual(
      initialIntake({ intakeKey: "k2" }),
    );
  });

  it("starts the review on completing step 3 and keeps it when the period changes", () => {
    expect(complete.review?.pickKey).toBe("t1");
    const later = { ...when, from: "10:00" };
    const state = run({ actions: [{ type: "setWhen", when: later }], from: complete });
    expect(state.pick).toEqual(pkg);
    expect(state.open).toBe("review");
  });

  it("patches the review and keeps its notes when step 3 completes again", () => {
    const noted = run({
      actions: [{ type: "patchReview", patch: { note: "Late" } }],
      from: complete,
    });
    const again = run({
      actions: [{ type: "pick", pick: { kind: "ONE_OFF" } }, done],
      from: noted,
    });
    expect(again.review).toMatchObject({ note: "Late", pickKey: "ONE_OFF" });
  });
});
