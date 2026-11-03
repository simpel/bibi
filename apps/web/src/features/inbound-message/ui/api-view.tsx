import { PlugIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { fieldLabel } from "../lib/field-label";
import { useFieldValue } from "./message-fields";
import { MessageHeader } from "./message-header";
import type { MessageViewProps } from "./message-view";

/** A request handed in over the API: who called and when, the request text, then its fields. */
export function ApiView({ message, received }: MessageViewProps) {
  const t = useTranslations("inbox");
  const show = useFieldValue();
  const fields = Object.entries(message.formFields ?? {});
  return (
    <article data-slot="api-view" className="overflow-hidden rounded-lg border bg-card">
      <MessageHeader
        icon={<PlugIcon />}
        sender={message.fromName ?? message.fromEmail ?? t("unknownSender")}
        detail={t("api.via")}
        received={received}
      />
      {message.text ? (
        <p className="max-w-prose whitespace-pre-wrap break-words px-5 py-5 text-base leading-relaxed">
          {message.text}
        </p>
      ) : null}
      {fields.length > 0 ? (
        <dl className="divide-y border-t bg-muted/30 px-5">
          {fields.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-4 py-2">
              <dt className="text-sm text-muted-foreground">{fieldLabel({ key })}</dt>
              <dd className="break-words font-mono text-sm">{show(value)}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </article>
  );
}
