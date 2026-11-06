import { PipelineCreateExamplesInputSchema } from "@bibi/core/schemas";
import { getSetupPreset } from "@bibi/core/setup-presets";
import { describe, expect, it } from "vitest";
import { type ExampleTexts, exampleOrdersInput } from "./example-orders";
import { draftFromKind, EMPTY_DRAFT } from "./setup-draft";

const texts: ExampleTexts = {
  typeNames: { customer: "Company", contact: "Contact", order: "Order", line: "Line" },
  customerName: "Example Company Ltd",
  contactName: "Anna Example",
  meeting: "Meeting",
  conference: "Conference",
  dinner: "Dinner",
};

const linesOf = ({ input }: { input: ReturnType<typeof exampleOrdersInput> }) =>
  input.orders.map((order) => order.lines.map((line) => line.itemType));

describe("example orders", () => {
  it("puts the chosen space and food types on three valid orders, the dinner advanced", () => {
    const draft = draftFromKind({
      preset: getSetupPreset({ key: "conference-estate" }),
      label: ({ name }) => name,
    });
    const input = exampleOrdersInput({ draft, texts });
    expect(PipelineCreateExamplesInputSchema.safeParse(input).success).toBe(true);
    expect(linesOf({ input })).toEqual([
      ["Conference room", "Coffee break"],
      ["Breakout room", "Lunch", "Dinner"],
      ["Conference room", "Dinner"],
    ]);
    expect(input.orders.map((order) => order.advance)).toEqual([false, false, true]);
  });

  it("gives orders without lines when no type is chosen", () => {
    const input = exampleOrdersInput({ draft: EMPTY_DRAFT, texts });
    expect(PipelineCreateExamplesInputSchema.safeParse(input).success).toBe(true);
    expect(linesOf({ input })).toEqual([[], [], []]);
  });
});
