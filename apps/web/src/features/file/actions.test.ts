import { ok } from "@bibi/core";
import { describe, expect, it, vi } from "vitest";

const runOperation = vi.fn();
vi.mock("@/server/run-operation", () => ({
  runOperation: (...args: unknown[]) => runOperation(...args),
}));

const { uploadFileAction } = await import("./actions");

describe("uploadFileAction", () => {
  it("runs the uploadFile operation and returns an ActionResult", async () => {
    runOperation.mockResolvedValueOnce(ok({ value: { key: "user_1/file_1" } }));

    const result = await uploadFileAction({
      input: {
        contentType: "image/png",
        base64:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      },
    });

    expect(result).toEqual({ ok: true, value: { key: "user_1/file_1" } });
    expect(runOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ contentType: "image/png" }),
      }),
    );
  });
});
