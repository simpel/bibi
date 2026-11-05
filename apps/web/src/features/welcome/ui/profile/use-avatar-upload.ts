"use client";

import { useFileUpload } from "@/features/file/use-file-upload";

export const AVATAR_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"];

export type UseAvatarUploadInput = { onChange: (key: string | null) => void };

/** Validates and uploads the picked photo at once; `onChange` gets the stored key. */
export function useAvatarUpload({ onChange }: UseAvatarUploadInput) {
  const { upload, pending } = useFileUpload({
    onSuccess: (key) => onChange(key),
    acceptedTypes: AVATAR_TYPES,
  });
  const pick = ({ file }: { file: File | undefined }) => upload({ file });
  return { pick, pending };
}
