"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@bibi/ui";
import { CameraIcon, Loader2Icon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { fileUrl } from "@/lib/file-url";
import { AVATAR_TYPES, useAvatarUpload } from "./use-avatar-upload";

export type AvatarFieldProps = {
  avatarKey: string | null;
  initials?: string;
  gravatarUrl?: string | null;
  onChange: (key: string | null) => void;
};

/**
 * Centered profile avatar directly under the step heading (ADR 0063).
 * Built with shadcn Avatar (Avatar, AvatarImage, AvatarFallback).
 * Defaults to Gravatar if present, displays uploaded photo when set.
 * Top-right badge: Camera icon when empty, X icon to remove when image is present.
 */
export function AvatarField({ avatarKey, gravatarUrl, onChange }: AvatarFieldProps) {
  const t = useTranslations("welcome.profile");
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const { pick, pending } = useAvatarUpload({ onChange });

  const [gravatarLoaded, setGravatarLoaded] = useState(false);
  const [gravatarDismissed, setGravatarDismissed] = useState(false);

  const hasUploadedImage = Boolean(avatarKey);
  const hasGravatarImage = Boolean(gravatarUrl && gravatarLoaded && !gravatarDismissed);
  const hasImage = hasUploadedImage || hasGravatarImage;
  const displaySrc = hasUploadedImage
    ? fileUrl({ key: avatarKey as string })
    : gravatarUrl && !gravatarDismissed
      ? (gravatarUrl as string)
      : null;

  return (
    <div className="flex justify-center py-2">
      <div className="relative">
        <button
          type="button"
          id={id}
          disabled={pending}
          onClick={() => input.current?.click()}
          className="group rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={hasImage ? t("changeAvatar") : t("uploadAvatar")}
        >
          <Avatar className="size-24 border-2 border-border transition-all group-hover:border-primary/50 group-hover:opacity-95">
            {displaySrc ? (
              <AvatarImage
                src={displaySrc}
                alt=""
                className="object-cover"
                onLoadingStatusChange={(status) => {
                  if (!hasUploadedImage) {
                    setGravatarLoaded(status === "loaded");
                  }
                }}
              />
            ) : null}
            <AvatarFallback className="bg-muted/60 text-muted-foreground transition-all group-hover:bg-muted group-hover:text-foreground">
              {pending ? (
                <Loader2Icon className="size-8 animate-spin" />
              ) : (
                <CameraIcon className="size-8 transition-transform group-hover:scale-105" />
              )}
            </AvatarFallback>
          </Avatar>
        </button>

        {hasImage ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (hasUploadedImage) onChange(null);
              if (hasGravatarImage) setGravatarDismissed(true);
            }}
            className="absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-background text-muted-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("removeAvatar")}
            title={t("removeAvatar")}
          >
            <XIcon className="size-3.5" />
          </button>
        ) : (
          <span
            className="pointer-events-none absolute -top-1 -right-1 flex size-7 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-sm"
            aria-hidden="true"
          >
            <CameraIcon className="size-3.5" />
          </span>
        )}

        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          onChange={(event) => pick({ file: event.target.files?.[0] })}
        />
      </div>
    </div>
  );
}
