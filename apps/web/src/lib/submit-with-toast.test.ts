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

describe("submitWithToast (CLAUDE.md Formulär)", () => {
  it("replaces the loading toast with success under the same id", async () => {
    const { api, calls } = fakeToast();
    await submitWithToast({ toast: api, run: async () => ({ ok: true, value: 1 }), messages });
    expect(calls).toEqual([
      { kind: "loading", message: "Sparar…" },
      { kind: "success", message: "Sparat", options: { id: "toast-1" } },
    ]);
  });

  it("turns a failure into a persistent, closable error toast with the same id", async () => {
    const { api, calls } = fakeToast();
    const outcome = await submitWithToast({
      toast: api,
      run: async () => ({ ok: false, message: "Funktionen är inte tillgänglig" }),
      messages,
    });
    expect(outcome.ok).toBe(false);
    expect(calls[1]).toEqual({
      kind: "error",
      message: "Funktionen är inte tillgänglig",
      options: { id: "toast-1", duration: Number.POSITIVE_INFINITY, closeButton: true },
    });
  });
});
