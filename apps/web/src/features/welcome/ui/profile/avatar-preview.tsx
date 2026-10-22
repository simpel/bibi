import { fileUrl } from "@/lib/file-url";

export type AvatarPreviewProps = { avatarKey: string | null; initials: string };

/** The photo, or the initials while there is none. */
export function AvatarPreview({ avatarKey, initials }: AvatarPreviewProps) {
  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-lg font-medium text-muted-foreground">
      {avatarKey ? (
        // biome-ignore lint/performance/noImgElement: private, session-checked file, not a static asset
        <img src={fileUrl({ key: avatarKey })} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
