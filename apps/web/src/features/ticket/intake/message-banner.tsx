import { MailIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { inboxMessageRoute } from "@/lib/inbox-routes";
import { Link } from "@/lib/navigation";
import { DraftReadPanel } from "./draft-read-panel";
import type { IntakeMessage } from "./intake-message";
import type { ReadField } from "./message-draft";

export type MessageBannerProps = {
  message: IntakeMessage | null;
  /** What the assistant read, when a message was read (ADR 0084). */
  read: readonly ReadField[] | null;
};

/**
 * "From <sender>'s message" (the ticket is attached to it on Create) with "What the assistant
 * read" beside it; only the latter for pasted text, nothing without either.
 */
export function MessageBanner({ message, read }: MessageBannerProps) {
  const t = useTranslations("ticketIntake");
  if (!message && !read?.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-1 text-sm">
      {message ? (
        <p className="flex min-h-8 flex-1 items-center gap-2">
          <MailIcon className="size-4 text-muted-foreground" aria-hidden />
          <Link href={inboxMessageRoute({ id: message.id })} className="hover:underline">
            {t("fromMessage", { sender: message.sender })}
          </Link>
        </p>
      ) : (
        <span className="flex-1" />
      )}
      {read ? <DraftReadPanel rows={read} /> : null}
    </div>
  );
}
