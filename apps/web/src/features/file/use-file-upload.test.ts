import type { AppErrorCode } from "@bibi/core";
import { describe, expect, it, vi } from "vitest";
import type { ActionError, ActionResult } from "@/lib/action-result";
import type { ToastApi } from "@/lib/submit-with-toast";
import { humanUploadError, performFileUpload } from "./use-file-upload";

type ToastCall = { kind: "loading" | "success" | "error"; message: string; options?: unknown };

function createFakeToast(): { api: ToastApi; calls: ToastCall[] } {
  const calls: ToastCall[] = [];
  const api: ToastApi = {
    loading: (message) => {
      calls.push({ kind: "loading", message });
      return "toast-42";
    },
    success: (message, options) => calls.push({ kind: "success", message, options }),
    error: (message, options) => calls.push({ kind: "error", message, options }),
  };
  return { api, calls };
}

function makeFile({
  name = "avatar.png",
  type = "image/png",
  size = 100,
}: {
  name?: string;
  type?: string;
  size?: number;
} = {}): File {
  const buffer = new Uint8Array(size);
  return new File([buffer], name, { type });
}

function makeError({
  code,
  message = "error",
  issues,
}: {
  code: AppErrorCode;
  message?: string;
  issues?: { path: string; message: string }[];
}): ActionError {
  return { code, message, issues: issues ?? [] };
}

describe("humanUploadError", () => {
  const file = makeFile({ name: "profile.png" });

  it("prioritizes issue message when present", () => {
    const error = makeError({
      code: "VALIDATION",
      message: "Invalid input",
      issues: [{ path: "file", message: "file is corrupted" }],
    });
    expect(humanUploadError({ error, file })).toBe(
      'Could not upload "profile.png": file is corrupted',
    );
  });

  it("translates UNAVAILABLE code to plain English", () => {
    const error = makeError({ code: "UNAVAILABLE" });
    expect(humanUploadError({ error, file })).toBe(
      'Could not upload "profile.png". File storage is temporarily unavailable. Please try again later.',
    );
  });

  it("translates VALIDATION code to plain English", () => {
    const error = makeError({ code: "VALIDATION" });
    expect(humanUploadError({ error, file })).toBe(
      '"profile.png" is not a valid image. Please select a valid PNG, JPEG, or WebP image.',
    );
  });

  it("translates UNAUTHENTICATED code to plain English", () => {
    const error = makeError({ code: "UNAUTHENTICATED" });
    expect(humanUploadError({ error, file })).toBe(
      'Could not upload "profile.png". You must be signed in to upload files.',
    );
  });

  it("translates FORBIDDEN code to plain English", () => {
    const error = makeError({ code: "FORBIDDEN" });
    expect(humanUploadError({ error, file })).toBe(
      'Could not upload "profile.png". You do not have permission to upload this file.',
    );
  });

  it("translates INTERNAL code to plain English", () => {
    const error = makeError({ code: "INTERNAL" });
    expect(humanUploadError({ error, file })).toBe(
      'Failed to upload "profile.png". An internal server error occurred. Please try again.',
    );
  });

  it("falls back to generic message for other codes", () => {
    const error = makeError({ code: "NOT_FOUND" });
    expect(humanUploadError({ error, file })).toBe(
      'Failed to upload "profile.png". Please try again.',
    );
  });
});

describe("performFileUpload toast lifecycle", () => {
  it("shows pending toast with file name, then resolves to success toast under same id", async () => {
    const { api, calls } = createFakeToast();
    const onSuccess = vi.fn();
    const file = makeFile({ name: "me.png", type: "image/png", size: 50 });
    const uploadFile = vi.fn().mockResolvedValue({
      ok: true,
      value: { key: "files/me-123.png" },
    } satisfies ActionResult<{
      key: string;
    }>);

    const ok = await performFileUpload({
      file,
      onSuccess,
      toast: api,
      uploadFile,
    });

    expect(ok).toBe(true);
    expect(onSuccess).toHaveBeenCalledWith("files/me-123.png");
    expect(calls).toEqual([
      { kind: "loading", message: "Uploading me.png" },
      { kind: "success", message: 'Uploaded "me.png"', options: { id: "toast-42" } },
    ]);
  });

  it("rejects invalid file types with a persistent error toast under same id", async () => {
    const { api, calls } = createFakeToast();
    const onSuccess = vi.fn();
    const file = makeFile({ name: "notes.pdf", type: "application/pdf" });
    const uploadFile = vi.fn();

    const ok = await performFileUpload({
      file,
      onSuccess,
      toast: api,
      uploadFile,
    });

    expect(ok).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(calls).toEqual([
      { kind: "loading", message: "Uploading notes.pdf" },
      {
        kind: "error",
        message: '"notes.pdf" has an unsupported format. Please use PNG, JPEG or WebP.',
        options: { id: "toast-42", duration: Number.POSITIVE_INFINITY, closeButton: true },
      },
    ]);
  });

  it("rejects files exceeding maxBytes with a persistent error toast under same id", async () => {
    const { api, calls } = createFakeToast();
    const onSuccess = vi.fn();
    const file = makeFile({ name: "huge.jpg", type: "image/jpeg", size: 3 * 1024 * 1024 });
    const uploadFile = vi.fn();

    const ok = await performFileUpload({
      file,
      onSuccess,
      maxBytes: 2 * 1024 * 1024,
      toast: api,
      uploadFile,
    });

    expect(ok).toBe(false);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(calls).toEqual([
      { kind: "loading", message: "Uploading huge.jpg" },
      {
        kind: "error",
        message: '"huge.jpg" is too large (maximum size is 2 MB).',
        options: { id: "toast-42", duration: Number.POSITIVE_INFINITY, closeButton: true },
      },
    ]);
  });

  it("turns server action failure into a persistent, humanly understandable error toast", async () => {
    const { api, calls } = createFakeToast();
    const onSuccess = vi.fn();
    const file = makeFile({ name: "photo.webp", type: "image/webp" });
    const uploadFile = vi.fn().mockResolvedValue({
      ok: false,
      error: makeError({ code: "UNAVAILABLE" }),
    } satisfies ActionResult<{ key: string }>);

    const ok = await performFileUpload({
      file,
      onSuccess,
      toast: api,
      uploadFile,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(calls).toEqual([
      { kind: "loading", message: "Uploading photo.webp" },
      {
        kind: "error",
        message:
          'Could not upload "photo.webp". File storage is temporarily unavailable. Please try again later.',
        options: { id: "toast-42", duration: Number.POSITIVE_INFINITY, closeButton: true },
      },
    ]);
  });

  it("turns unexpected network exceptions into a persistent error toast under same id", async () => {
    const { api, calls } = createFakeToast();
    const onSuccess = vi.fn();
    const file = makeFile({ name: "snap.png", type: "image/png" });
    const uploadFile = vi.fn().mockRejectedValue(new Error("Network failed"));

    const ok = await performFileUpload({
      file,
      onSuccess,
      toast: api,
      uploadFile,
    });

    expect(ok).toBe(false);
    expect(onSuccess).not.toHaveBeenCalled();
    expect(calls).toEqual([
      { kind: "loading", message: "Uploading snap.png" },
      {
        kind: "error",
        message: 'Failed to upload "snap.png" due to a network error. Please try again.',
        options: { id: "toast-42", duration: Number.POSITIVE_INFINITY, closeButton: true },
      },
    ]);
  });
});
