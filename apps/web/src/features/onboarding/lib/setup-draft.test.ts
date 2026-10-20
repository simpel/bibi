import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { latestSetupDraft } from "./setup-draft";

const input = ({ name }: { name: string }) => ({
  itemTypes: [{ name }],
  phases: [{ name: "Request", color: "#3b82f6" }],
  cells: [],
});

const message = ({ state, name }: { state: string; name: string }) =>
  ({
    id: name,
    role: "assistant",
    parts: [
      { type: "tool-pipelineSetup_preview", toolCallId: name, state, input: input({ name }) },
    ],
  }) as unknown as UIMessage;

describe("latestSetupDraft", () => {
  it("is null without a preview", () => {
    expect(latestSetupDraft({ messages: [] })).toBeNull();
  });

  it("takes the newest finished preview and ignores running ones", () => {
    const messages = [
      message({ state: "output-available", name: "Room" }),
      message({ state: "output-available", name: "Dish" }),
      message({ state: "input-streaming", name: "Half" }),
    ];
    expect(latestSetupDraft({ messages })?.itemTypes).toEqual(["Dish"]);
  });

  it("takes a preset draft from its structured output", () => {
    const preset = {
      id: "preset",
      role: "assistant",
      parts: [
        {
          type: "tool-pipelineSetup_presetDraft",
          toolCallId: "preset",
          state: "output-available",
          input: {},
          output: { structuredContent: input({ name: "Hall" }) },
        },
      ],
    } as unknown as UIMessage;
    const running = message({ state: "input-available", name: "Half" });
    expect(latestSetupDraft({ messages: [preset, running] })?.itemTypes).toEqual(["Hall"]);
  });
});
