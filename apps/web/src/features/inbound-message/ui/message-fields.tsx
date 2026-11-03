import { PaperclipIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { fieldLabel } from "../lib/field-label";
import type { InboundMessageValue } from "./message-value";

type FieldValue = NonNullable<InboundMessageValue["formFields"]>[string];

/** Yes or No for a checkbox; anything else exactly as sent (a number may be a year or a postcode). */
export function useFieldValue() {
  const common = useTranslations("common");
  return (value: FieldValue) => {
    if (value === null || value === "") return "–";
    if (typeof value === "boolean") return value ? common("yes") : common("no");
    return String(value);
  };
}

export type MessageFieldsProps = { fields: NonNullable<InboundMessageValue["formFields"]> };

/** The values a form or API sender filled in, as labelled rows under a heading. */
export function MessageFields({ fields }: MessageFieldsProps) {
  const t = useTranslations("inbox");
  const show = useFieldValue();
  const entries = Object.entries(fields);
  if (entries.length === 0) return null;
  return (
    <section data-slot="message-fields" className="grid gap-2">
      <h2 className="text-xs font-medium text-muted-foreground">{t("fieldsTitle")}</h2>
      <dl className="grid grid-cols-[minmax(8rem,auto)_1fr] gap-x-6 gap-y-1.5 text-sm">
        {entries.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="text-muted-foreground">{fieldLabel({ key })}</dt>
            <dd className="break-words">{show(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type MessageAttachmentsProps = { attachments: InboundMessageValue["attachments"] };

/** The names of the message's attachments; nothing when it has none. */
export function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  const t = useTranslations("inbox");
  if (attachments.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
      {attachments.map((attachment) => (
        <li key={attachment.id} className="inline-flex items-center gap-1">
          <PaperclipIcon className="size-3" aria-hidden />
          {attachment.filename ?? t("unnamedAttachment")}
        </li>
      ))}
    </ul>
  );
}
