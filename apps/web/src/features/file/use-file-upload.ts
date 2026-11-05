"use client";

import { FILE_CONTENT_TYPES, type FileContentType, MAX_FILE_BYTES } from "@bibi/core/schemas";
import { toast as sonnerToast } from "@bibi/ui";
import { useTransition } from "react";
import type { ActionError, ActionResult } from "@/lib/action-result";
import type { ToastApi } from "@/lib/submit-with-toast";
import { uploadFileAction } from "./actions";
import { readFileBase64 } from "./read-file-base64";

export { FILE_CONTENT_TYPES, MAX_FILE_BYTES };

export type MessageOrFn = string | ((file: File) => string);

export type UploadMessages = {
  pending?: MessageOrFn;
  success?: MessageOrFn;
  fileWrongType?: MessageOrFn;
  fileTooLarge?: MessageOrFn;
};

export type UploadFileFn = (input: {
  input: { contentType: FileContentType; base64: string };
}) => Promise<ActionResult<{ key: string }>>;

export type PerformFileUploadInput = {
  file: File;
  onSuccess: (key: string) => void;
  acceptedTypes?: readonly string[];
  maxBytes?: number;
  messages?: UploadMessages;
  toast: ToastApi;
  uploadFile?: UploadFileFn;
};

export type UseFileUploadInput = {
  onSuccess: (key: string) => void;
  acceptedTypes?: readonly string[];
  maxBytes?: number;
  messages?: UploadMessages;
  /** Injectable toast API for testing (CLAUDE.md Forms). Defaults to `@bibi/ui`'s `toast`. */
  toast?: ToastApi;
  /** Injectable upload action for testing. Defaults to `uploadFileAction`. */
  uploadFile?: UploadFileFn;
};

export function humanUploadError({ error, file }: { error: ActionError; file: File }): string {
  if (error.issues && error.issues.length > 0) {
    const first = error.issues[0]?.message;
    if (first) return `Could not upload "${file.name}": ${first}`;
  }
  switch (error.code) {
    case "UNAVAILABLE":
      return `Could not upload "${file.name}". File storage is temporarily unavailable. Please try again later.`;
    case "VALIDATION":
      return `"${file.name}" is not a valid image. Please select a valid PNG, JPEG, or WebP image.`;
    case "UNAUTHENTICATED":
      return `Could not upload "${file.name}". You must be signed in to upload files.`;
    case "FORBIDDEN":
      return `Could not upload "${file.name}". You do not have permission to upload this file.`;
    case "INTERNAL":
      return `Failed to upload "${file.name}". An internal server error occurred. Please try again.`;
    default:
      return `Failed to upload "${file.name}". Please try again.`;
  }
}

function resolvePendingMessage({
  message,
  file,
}: {
  message: MessageOrFn | undefined;
  file: File;
}): string {
  if (typeof message === "function") return message(file);
  if (typeof message === "string") return message;
  return `Uploading ${file.name}`;
}

function resolveSuccessMessage({
  message,
  file,
}: {
  message: MessageOrFn | undefined;
  file: File;
}): string {
  if (typeof message === "function") return message(file);
  if (typeof message === "string") return message;
  return `Uploaded "${file.name}"`;
}

function resolveWrongTypeMessage({
  message,
  file,
}: {
  message: MessageOrFn | undefined;
  file: File;
}): string {
  if (typeof message === "function") return message(file);
  if (typeof message === "string") return message;
  return `"${file.name}" has an unsupported format. Please use PNG, JPEG or WebP.`;
}

function resolveTooLargeMessage({
  message,
  file,
  maxBytes,
}: {
  message: MessageOrFn | undefined;
  file: File;
  maxBytes: number;
}): string {
  if (typeof message === "function") return message(file);
  if (typeof message === "string") return message;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  return `"${file.name}" is too large (maximum size is ${maxMb} MB).`;
}

/**
 * Runs the upload flow: validates type & size, reads base64, runs `file.upload`,
 * shows a pending "Uploading X" toast that resolves to humanly understandable success
 * or persistent failure, and calls `onSuccess` with the storage key.
 */
export async function performFileUpload({
  file,
  onSuccess,
  acceptedTypes = FILE_CONTENT_TYPES,
  maxBytes = MAX_FILE_BYTES,
  messages,
  toast,
  uploadFile = uploadFileAction,
}: PerformFileUploadInput): Promise<boolean> {
  const id = toast.loading(resolvePendingMessage({ message: messages?.pending, file }));

  if (!acceptedTypes.includes(file.type)) {
    const errorMsg = resolveWrongTypeMessage({ message: messages?.fileWrongType, file });
    toast.error(errorMsg, { id, duration: Number.POSITIVE_INFINITY, closeButton: true });
    return false;
  }

  if (file.size > maxBytes) {
    const errorMsg = resolveTooLargeMessage({ message: messages?.fileTooLarge, file, maxBytes });
    toast.error(errorMsg, { id, duration: Number.POSITIVE_INFINITY, closeButton: true });
    return false;
  }

  let base64: string;
  try {
    base64 = await readFileBase64({ file });
  } catch {
    toast.error(`Could not read "${file.name}". Please try another file.`, {
      id,
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
    return false;
  }

  const contentType = file.type as FileContentType;
  try {
    const result = await uploadFile({ input: { contentType, base64 } });
    if (!result.ok) {
      const errorMsg = humanUploadError({ error: result.error, file });
      toast.error(errorMsg, { id, duration: Number.POSITIVE_INFINITY, closeButton: true });
      return false;
    }

    const successMsg = resolveSuccessMessage({ message: messages?.success, file });
    toast.success(successMsg, { id });
    onSuccess(result.value.key);
    return true;
  } catch {
    toast.error(`Failed to upload "${file.name}" due to a network error. Please try again.`, {
      id,
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
    return false;
  }
}

/**
 * Generic file upload hook: validates type & size, reads base64, runs `file.upload`,
 * shows a pending "Uploading X" toast that resolves to humanly understandable success
 * or persistent failure, and gives the caller the resulting storage key.
 */
export function useFileUpload({
  onSuccess,
  acceptedTypes = FILE_CONTENT_TYPES,
  maxBytes = MAX_FILE_BYTES,
  messages,
  toast = sonnerToast as unknown as ToastApi,
  uploadFile = uploadFileAction,
}: UseFileUploadInput) {
  const [pending, startTransition] = useTransition();

  const upload = ({ file }: { file: File | undefined }) => {
    if (!file) return;

    startTransition(async () => {
      await performFileUpload({
        file,
        onSuccess,
        acceptedTypes,
        maxBytes,
        messages,
        toast,
        uploadFile,
      });
    });
  };

  return { upload, pending };
}
