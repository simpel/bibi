"use client";

import type { FileContentType } from "@bibi/core/schemas";
import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { uploadAvatarAction } from "../../actions";
import { readFileBase64 } from "./read-file-base64";

export const AVATAR_TYPES: readonly string[] = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 2 * 1024 * 1024;

export type UseAvatarUploadInput = { onChange: (key: string | null) => void };

/** Validates and uploads the picked photo at once; `onChange` gets the stored key. */
export function useAvatarUpload({ onChange }: UseAvatarUploadInput) {
  const t = useTranslations("welcome.profile");
  const { run, pending } = useToastAction();
  const pick = async ({ file }: { file: File | undefined }) => {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return void toast.error(t("avatarWrongType"));
    if (file.size > MAX_BYTES) return void toast.error(t("avatarTooLarge"));
    const base64 = await readFileBase64({ file });
    const contentType = file.type as FileContentType;
    run({
      action: () => uploadAvatarAction({ input: { contentType, base64 } }),
      messages: { pending: t("uploading"), success: t("avatar") },
      onSuccess: ({ value }) => onChange(value.key),
    });
  };
  return { pick, pending };
}
