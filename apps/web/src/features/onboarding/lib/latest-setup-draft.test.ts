import type { UIMessage } from "ai";
import { describe, expect, it } from "vitest";
import { latestSetupDraft } from "./latest-setup-draft";

const draft = ({ phase }: { phase: string }) => ({
  itemTypes: [],
  phases: [
    { name: phase, color: "#f59e0b", entry: true },
    { name: "Lost", color: "#6b7280", terminal: true },
  ],
  cells: [],
});

type PreviewPartInput = { id: string; phase: string; ready: boolean };

const previewPart = ({ id, phase, ready }: PreviewPartInput) => ({
  type: "tool-pipelineSetup_preview" as const,
  toolCallId: id,
  state: "output-available" as const,
  input: draft({ phase }),
  output: { content: [], structuredContent: { ready, problems: [], steps: [] } },
});

const assistant = ({ parts }: { parts: unknown[] }): UIMessage =>
  ({ id: `m${parts.length}`, role: "assistant", parts }) as UIMessage;

describe("latestSetupDraft", () => {
  it("returns the latest draft the preview reported as ready", () => {
    const messages = [
      assistant({ parts: [previewPart({ id: "a", phase: "First", ready: true })] }),
      assistant({
        parts: [
          previewPart({ id: "b", phase: "Second", ready: true }),
          previewPart({ id: "c", phase: "Broken", ready: false }),
        ],
      }),
    ];
    expect(latestSetupDraft({ messages })?.phases[0]?.name).toBe("Second");
  });

  it("is null without a ready preview", () => {
    const messages = [assistant({ parts: [previewPart({ id: "a", phase: "X", ready: false })] })];
    expect(latestSetupDraft({ messages })).toBeNull();
    expect(latestSetupDraft({ messages: [] })).toBeNull();
  });
});
