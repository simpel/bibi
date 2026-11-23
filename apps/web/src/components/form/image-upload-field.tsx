import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { FILE_CONTENT_TYPES, useFileUpload } from "@/features/file/use-file-upload";

export type ImageUploadFieldProps = {
  /** The stored key from `file.upload`; "" = no image. */
  imageKey: string;
  onChange: (key: string) => void;
  /** What removing the image falls back to, e.g. "the icon shows again". */
  hint: string;
};

/**
 * Upload, replace or remove one record image (ADR 0063). The file is stored at once under the
 * caller's key; the record takes the key when its form is saved.
 */
export function ImageUploadField({ imageKey, onChange, hint }: ImageUploadFieldProps) {
  const t = useTranslations("common.imageUpload");
  const input = useRef<HTMLInputElement>(null);
  const { upload, pending } = useFileUpload({
    onSuccess: onChange,
    acceptedTypes: FILE_CONTENT_TYPES,
  });
  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => input.current?.click()}
        >
          {imageKey ? t("replace") : t("upload")}
        </Button>
        {imageKey ? (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            {t("remove")}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        {t("limits")} {hint}
      </p>
      <input
        ref={input}
        type="file"
        accept={FILE_CONTENT_TYPES.join(",")}
        className="sr-only"
        onChange={(event) => upload({ file: event.target.files?.[0] })}
      />
    </div>
  );
}
