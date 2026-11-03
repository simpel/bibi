import { Card } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MessageAttachments, MessageFields } from "./message-fields";
import type { InboundMessageValue } from "./message-value";

export type MessageBodyProps = { message: InboundMessageValue };

/**
 * The message page's reading view: the text at reading size, then what the sender filled in and
 * the attachments. Written by outside senders: shown as text, never as markup.
 */
export function MessageBody({ message }: MessageBodyProps) {
  const t = useTranslations("inbox");
  return (
    <Card data-slot="message-body" className="grid gap-6 p-6 shadow-none">
      <p className="max-w-prose whitespace-pre-wrap break-words text-base leading-relaxed">
        {message.text || <span className="text-muted-foreground">{t("noBody")}</span>}
      </p>
      {message.formFields ? <MessageFields fields={message.formFields} /> : null}
      <MessageAttachments attachments={message.attachments} />
    </Card>
  );
}
