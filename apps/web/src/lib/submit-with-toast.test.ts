import { describe, expect, it } from "vitest";
import { submitWithToast, type ToastApi } from "./submit-with-toast";

type Call = { kind: string; message: string; options?: unknown };

function fakeToast(): { api: ToastApi; calls: Call[] } {
  const calls: Call[] = [];
  const api: ToastApi = {
    loading: (message) => {
      calls.push({ kind: "loading", message });
      return "toast-1";
    },
    success: (message, options) => calls.push({ kind: "success", message, options }),
    error: (message, options) => calls.push({ kind: "error", message, options }),
  };
  return { api, calls };
}

const messages = { pending: "Sparar…", success: "Sparat" };
const translate = ({ key }: { key: string }) => `errors.${key}`;

describe("submitWithToast (CLAUDE.md Formulär)", () => {
  it("replaces the loading toast with success under the same id", async () => {
    const { api, calls } = fakeToast();
    await submitWithToast({
      toast: api,
      run: async () => ({ ok: true, value: 1 }),
      messages,
      translate,
    });
    expect(calls).toEqual([
      { kind: "loading", message: "Sparar…" },
      { kind: "success", message: "Sparat", options: { id: "toast-1" } },
    ]);
  });

  it("turns a failure into a persistent, closable error toast with the same id", async () => {
    const { api, calls } = fakeToast();
    const error = { code: "UNAVAILABLE" as const, message: "x", issues: [] };
    const result = await submitWithToast({
      toast: api,
      run: async () => ({ ok: false, error }),
      messages,
      translate,
    });
    expect(result.ok).toBe(false);
    expect(calls[1]).toEqual({
      kind: "error",
      message: "errors.unavailable",
      options: { id: "toast-1", duration: Number.POSITIVE_INFINITY, closeButton: true },
    });
  });

  it("builds the success text from the result when given a function", async () => {
    const { api, calls } = fakeToast();
    await submitWithToast({
      toast: api,
      run: async () => ({ ok: true, value: 3 }),
      messages: { pending: "Importerar…", success: ({ value }) => `${value} skapade` },
      translate,
    });
    expect(calls.at(-1)).toMatchObject({ kind: "success", message: "3 skapade" });
  });
});
