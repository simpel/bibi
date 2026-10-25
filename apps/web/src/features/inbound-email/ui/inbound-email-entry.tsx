import type { InboundEmailDto } from "@bibi/core/schemas";
import { PaperclipIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

/** A received mail as the server (Date) or a tool result (ISO string) carries it. */
export type InboundEmailValue = Omit<InboundEmailDto, "receivedAt" | "createdAt"> & {
  receivedAt: Date | string;
};

export type InboundEmailEntryProps = { email: InboundEmailValue };

/**
 * One received mail: sender, time, subject, the plain-text body and attachment names. The HTML
 * body is never rendered (untrusted markup from outside the organization).
 */
export function InboundEmailEntry({ email }: InboundEmailEntryProps) {
  const t = useTranslations("inboundEmail");
  const format = useDateTimeFormat();
  const received = new Date(email.receivedAt);
  return (
    <article data-slot="inbound-email-entry" className="grid gap-2 py-3 text-sm">
      <header className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{email.fromAddress}</span>
        <time className="ml-auto text-xs text-muted-foreground" dateTime={received.toISOString()}>
          {format.dateTime({ instant: received })}
        </time>
      </header>
      <p className="font-medium">{email.subject ?? t("noSubject")}</p>
      <p className="whitespace-pre-wrap break-words text-muted-foreground">
        {email.text ?? (email.html ? t("htmlOnly") : t("noBody"))}
      </p>
      {email.attachments.length > 0 ? (
        <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {email.attachments.map((attachment) => (
            <li key={attachment.id} className="inline-flex items-center gap-1">
              <PaperclipIcon className="size-3" aria-hidden />
              {attachment.filename ?? t("unnamedAttachment")}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
