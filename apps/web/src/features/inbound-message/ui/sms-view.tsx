import { useTranslations } from "next-intl";
import type { MessageViewProps } from "./message-view";

/** A text message as a chat bubble: the number above, the time under the bubble. */
export function SmsView({ message, received }: MessageViewProps) {
  const t = useTranslations("inbox");
  const sender = message.fromName ?? message.fromPhone ?? t("unknownSender");
  const number = message.fromName ? message.fromPhone : null;
  return (
    <article data-slot="sms-view" className="grid gap-1.5 rounded-lg border bg-card px-5 py-5">
      <div className="text-sm">
        <span className="font-medium">{sender}</span>
        <span className="text-muted-foreground">
          {" "}
          · {[number, t("channels.SMS")].filter(Boolean).join(" · ")}
        </span>
      </div>
      <p className="max-w-[85%] justify-self-start whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-muted px-4 py-2.5 text-base leading-relaxed">
        {message.text || t("noBody")}
      </p>
      <time className="text-xs text-muted-foreground">{received}</time>
    </article>
  );
}
