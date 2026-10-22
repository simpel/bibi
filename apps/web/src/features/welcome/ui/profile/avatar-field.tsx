"use client";

import { Button, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useId, useRef } from "react";
import { AvatarPreview } from "./avatar-preview";
import { AVATAR_TYPES, useAvatarUpload } from "./use-avatar-upload";

export type AvatarFieldProps = {
  avatarKey: string | null;
  initials: string;
  onChange: (key: string | null) => void;
};

/** Optional photo (ADR 0063): uploads at once, the profile form saves the returned key. */
export function AvatarField({ avatarKey, initials, onChange }: AvatarFieldProps) {
  const t = useTranslations("welcome.profile");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const { pick, pending } = useAvatarUpload({ onChange });
  return (
    <div className="flex items-center gap-4">
      <AvatarPreview avatarKey={avatarKey} initials={initials} />
      <div className="grid gap-1">
        <Label htmlFor={id}>{t("avatar")}</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => input.current?.click()}
          >
            {avatarKey ? t("changeAvatar") : t("uploadAvatar")}
          </Button>
          {avatarKey ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              {t("removeAvatar")}
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">{t("avatarHint")}</p>
        <input
          ref={input}
          id={id}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => pick({ file: event.target.files?.[0] })}
        />
      </div>
    </div>
  );
}
